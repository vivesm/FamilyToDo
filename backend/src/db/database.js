import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/familytodo.db');

// Create database connection with verbose mode in development
const sqlite = process.env.NODE_ENV === 'development' 
  ? sqlite3.verbose() 
  : sqlite3;

// Connection pool configuration for SQLite
const DB_CONFIG = {
  timeout: 5000, // 5 seconds
  busyTimeout: 1000, // 1 second for busy database
  maxRetries: 3,
  retryDelay: 100 // milliseconds
};

let db = null;

// Initialize database connection with optimized settings
function initializeConnection() {
  return new Promise((resolve, reject) => {
    db = new sqlite.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      
      console.log('Connected to SQLite database');
      
      // Configure SQLite for optimal performance and concurrency
      const pragmaCommands = [
        // Enable foreign keys
        'PRAGMA foreign_keys = ON',
        
        // Use WAL mode for better concurrency
        'PRAGMA journal_mode = WAL',
        
        // Optimize SQLite settings
        'PRAGMA synchronous = NORMAL', // Balance between safety and speed
        'PRAGMA cache_size = -64000', // 64MB cache
        'PRAGMA temp_store = MEMORY', // Use memory for temp tables
        'PRAGMA mmap_size = 268435456', // 256MB memory-mapped I/O
        'PRAGMA optimize', // Auto-optimize statistics
        
        // Set busy timeout
        `PRAGMA busy_timeout = ${DB_CONFIG.busyTimeout}`,
        
        // Auto-checkpoint WAL
        'PRAGMA wal_autocheckpoint = 1000'
      ];
      
      let completed = 0;
      let hasError = false;
      
      pragmaCommands.forEach((pragma, index) => {
        db.run(pragma, (err) => {
          if (err && !hasError) {
            hasError = true;
            console.error(`Error executing ${pragma}:`, err);
            reject(err);
            return;
          }
          
          completed++;
          if (completed === pragmaCommands.length && !hasError) {
            resolve(db);
          }
        });
      });
    });
    
    // Set database timeout
    if (db) {
      db.configure('busyTimeout', DB_CONFIG.busyTimeout);
    }
  });
}

// Connection recovery and retry logic
async function withRetry(operation, retries = DB_CONFIG.maxRetries) {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0 && (error.code === 'SQLITE_BUSY' || error.code === 'SQLITE_LOCKED')) {
      console.warn(`Database busy, retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, DB_CONFIG.retryDelay));
      return withRetry(operation, retries - 1);
    }
    throw error;
  }
}

// Health check function
export function checkDatabaseHealth() {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database connection not initialized'));
      return;
    }
    
    db.get('SELECT 1 as health', (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve({ healthy: true, timestamp: new Date().toISOString() });
      }
    });
  });
}

// Initialize connection on startup
await initializeConnection();

// Database initialization
export async function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create people table
      db.run(`
        CREATE TABLE IF NOT EXISTS people (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT,
          photo_url TEXT,
          color TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Error creating people table:', err);
      });

      // Add email column if it doesn't exist (for existing databases)
      db.run(`
        ALTER TABLE people ADD COLUMN email TEXT
      `, (err) => {
        // Ignore error if column already exists
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding email column:', err);
        }
      });

      // Create categories table
      db.run(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          icon TEXT NOT NULL,
          color TEXT,
          sort_order INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Error creating categories table:', err);
      });

      // Create tasks table
      db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          category_id INTEGER,
          priority INTEGER DEFAULT 3,
          due_date DATETIME,
          recurring_pattern TEXT,
          completed BOOLEAN DEFAULT 0,
          completed_at DATETIME,
          google_event_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
        )
      `, (err) => {
        if (err) console.error('Error creating tasks table:', err);
      });

      // Create task_assignments table
      db.run(`
        CREATE TABLE IF NOT EXISTS task_assignments (
          task_id INTEGER NOT NULL,
          person_id INTEGER NOT NULL,
          assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (task_id, person_id),
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
          FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) console.error('Error creating task_assignments table:', err);
      });

      // Create task_attachments table
      db.run(`
        CREATE TABLE IF NOT EXISTS task_attachments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id INTEGER NOT NULL,
          filename TEXT NOT NULL,
          original_name TEXT,
          url TEXT NOT NULL,
          type TEXT,
          size INTEGER,
          uploaded_by INTEGER,
          uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
          FOREIGN KEY (uploaded_by) REFERENCES people(id) ON DELETE SET NULL
        )
      `, (err) => {
        if (err) console.error('Error creating task_attachments table:', err);
      });

      // Create task_comments table
      db.run(`
        CREATE TABLE IF NOT EXISTS task_comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id INTEGER NOT NULL,
          person_id INTEGER,
          comment TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
          FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE SET NULL
        )
      `, (err) => {
        if (err) console.error('Error creating task_comments table:', err);
      });

      // Create comment_attachments table
      db.run(`
        CREATE TABLE IF NOT EXISTS comment_attachments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          comment_id INTEGER NOT NULL,
          filename TEXT NOT NULL,
          original_name TEXT,
          url TEXT NOT NULL,
          type TEXT,
          size INTEGER,
          uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (comment_id) REFERENCES task_comments(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) console.error('Error creating comment_attachments table:', err);
      });

      // Add missing columns for soft delete (for existing databases)
      
      // Tasks soft delete columns
      db.run(`
        ALTER TABLE tasks ADD COLUMN deleted BOOLEAN DEFAULT 0
      `, (err) => {
        // Ignore error if column already exists
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding deleted column to tasks:', err);
        }
      });

      db.run(`
        ALTER TABLE tasks ADD COLUMN deleted_at DATETIME
      `, (err) => {
        // Ignore error if column already exists
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding deleted_at column to tasks:', err);
        }
      });

      // People soft delete columns
      db.run(`
        ALTER TABLE people ADD COLUMN deleted BOOLEAN DEFAULT 0
      `, (err) => {
        // Ignore error if column already exists
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding deleted column to people:', err);
        }
      });

      db.run(`
        ALTER TABLE people ADD COLUMN deleted_at DATETIME
      `, (err) => {
        // Ignore error if column already exists
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding deleted_at column to people:', err);
        }
      });

      // Categories soft delete columns
      db.run(`
        ALTER TABLE categories ADD COLUMN deleted BOOLEAN DEFAULT 0
      `, (err) => {
        // Ignore error if column already exists
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding deleted column to categories:', err);
        }
      });

      db.run(`
        ALTER TABLE categories ADD COLUMN deleted_at DATETIME
      `, (err) => {
        // Ignore error if column already exists
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding deleted_at column to categories:', err);
        }
      });

      // Create indexes for better performance
      
      // Task indexes
      db.run('CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)');
      db.run('CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)');
      db.run('CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)');
      db.run('CREATE INDEX IF NOT EXISTS idx_tasks_deleted ON tasks(deleted)');
      db.run('CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category_id)');
      
      // People indexes
      db.run('CREATE INDEX IF NOT EXISTS idx_people_deleted ON people(deleted)');
      db.run('CREATE INDEX IF NOT EXISTS idx_people_name ON people(name)');
      
      // Category indexes
      db.run('CREATE INDEX IF NOT EXISTS idx_categories_deleted ON categories(deleted)');
      db.run('CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(sort_order)');
      
      // Relationship indexes
      db.run('CREATE INDEX IF NOT EXISTS idx_assignments_person ON task_assignments(person_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON task_attachments(task_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_comment_attachments_comment ON comment_attachments(comment_id)');

      // Insert default categories if they don't exist
      db.get('SELECT COUNT(*) as count FROM categories', (err, row) => {
        if (!err && row.count === 0) {
          const defaultCategories = [
            { name: 'Shopping', icon: '🛒', color: '#10B981', sort_order: 1 },
            { name: 'Home', icon: '🏠', color: '#3B82F6', sort_order: 2 },
            { name: 'Homework', icon: '📚', color: '#8B5CF6', sort_order: 3 },
            { name: 'Activities', icon: '🏃', color: '#F59E0B', sort_order: 4 },
            { name: 'Health', icon: '💊', color: '#EF4444', sort_order: 5 },
            { name: 'Fun', icon: '🎮', color: '#EC4899', sort_order: 6 }
          ];

          const stmt = db.prepare(
            'INSERT INTO categories (name, icon, color, sort_order) VALUES (?, ?, ?, ?)'
          );

          defaultCategories.forEach(cat => {
            stmt.run(cat.name, cat.icon, cat.color, cat.sort_order);
          });

          stmt.finalize();
          console.log('Default categories inserted');
        }
      });

      resolve();
    });
  });
}

// Helper function to run queries with promises and retry logic
export function runQuery(sql, params = []) {
  return withRetry(() => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Database connection not initialized'));
        return;
      }
      
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  });
}

// Helper function to get single row with retry logic
export function getOne(sql, params = []) {
  return withRetry(() => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Database connection not initialized'));
        return;
      }
      
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  });
}

// Helper function to get multiple rows with retry logic
export function getAll(sql, params = []) {
  return withRetry(() => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Database connection not initialized'));
        return;
      }
      
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  });
}

// Transaction helper functions with retry logic
export function beginTransaction() {
  return withRetry(() => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Database connection not initialized'));
        return;
      }
      
      db.run('BEGIN IMMEDIATE', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

export function commitTransaction() {
  return withRetry(() => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Database connection not initialized'));
        return;
      }
      
      db.run('COMMIT', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

export function rollbackTransaction() {
  return withRetry(() => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Database connection not initialized'));
        return;
      }
      
      db.run('ROLLBACK', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

// Execute multiple queries in a transaction with enhanced error handling
export async function runInTransaction(callback) {
  let transactionStarted = false;
  
  try {
    await beginTransaction();
    transactionStarted = true;
    
    const result = await callback();
    await commitTransaction();
    transactionStarted = false;
    
    return result;
  } catch (error) {
    if (transactionStarted) {
      try {
        await rollbackTransaction();
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
        // Don't override the original error
      }
    }
    throw error;
  }
}

// Database statistics for monitoring
export async function getDatabaseStats() {
  try {
    const [fileSize, pageCount, pageSize, walMode] = await Promise.all([
      getOne("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()"),
      getOne("SELECT * FROM pragma_page_count()"),
      getOne("SELECT * FROM pragma_page_size()"),
      getOne("SELECT * FROM pragma_journal_mode()")
    ]);
    
    return {
      fileSize: fileSize?.size || 0,
      pageCount: pageCount?.page_count || 0,
      pageSize: pageSize?.page_size || 0,
      journalMode: walMode?.journal_mode || 'unknown',
      path: dbPath,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Failed to get database stats: ${error.message}`);
  }
}

export default db;