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

const db = new sqlite.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

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

      // Add missing columns for soft delete (for existing databases)
      db.run(`
        ALTER TABLE tasks ADD COLUMN deleted BOOLEAN DEFAULT 0
      `, (err) => {
        // Ignore error if column already exists
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding deleted column:', err);
        }
      });

      db.run(`
        ALTER TABLE tasks ADD COLUMN deleted_at DATETIME
      `, (err) => {
        // Ignore error if column already exists
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding deleted_at column:', err);
        }
      });

      // Create indexes for better performance
      db.run('CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)');
      db.run('CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)');
      db.run('CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)');
      db.run('CREATE INDEX IF NOT EXISTS idx_tasks_deleted ON tasks(deleted)');
      db.run('CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_assignments_person ON task_assignments(person_id)');

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

// Helper function to run queries with promises
export function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

// Helper function to get single row
export function getOne(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Helper function to get multiple rows
export function getAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Transaction helper functions
export function beginTransaction() {
  return new Promise((resolve, reject) => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function commitTransaction() {
  return new Promise((resolve, reject) => {
    db.run('COMMIT', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function rollbackTransaction() {
  return new Promise((resolve, reject) => {
    db.run('ROLLBACK', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Execute multiple queries in a transaction
export async function runInTransaction(callback) {
  try {
    await beginTransaction();
    const result = await callback();
    await commitTransaction();
    return result;
  } catch (error) {
    await rollbackTransaction();
    throw error;
  }
}

export default db;