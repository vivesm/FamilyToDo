import { runQuery } from '../database.js';

/**
 * Migration to add enhanced recurring task fields
 */
export async function addRecurringEnhancements() {
  console.log('Running migration: Enhanced recurring tasks...');
  
  const migrations = [
    // Add recurring interval (e.g., every 2 weeks)
    `ALTER TABLE tasks ADD COLUMN recurring_interval INTEGER DEFAULT 1`,
    
    // Add recurring unit (day/week/month/year)
    `ALTER TABLE tasks ADD COLUMN recurring_unit TEXT`,
    
    // Add specific days for weekly recurrence (JSON array, e.g., ["monday", "wednesday", "friday"])
    `ALTER TABLE tasks ADD COLUMN recurring_days TEXT`,
    
    // Add recurring from (due_date or completion)
    `ALTER TABLE tasks ADD COLUMN recurring_from TEXT DEFAULT 'due_date'`,
    
    // Add end date for recurring tasks
    `ALTER TABLE tasks ADD COLUMN recurring_end_date DATETIME`,
    
    // Add max occurrences
    `ALTER TABLE tasks ADD COLUMN recurring_end_count INTEGER`,
    
    // Add current occurrence number
    `ALTER TABLE tasks ADD COLUMN recurring_occurrence INTEGER DEFAULT 1`,
    
    // Add recurring group ID to link related tasks
    `ALTER TABLE tasks ADD COLUMN recurring_group_id TEXT`,
    
    // Add parent task ID to track original task
    `ALTER TABLE tasks ADD COLUMN parent_task_id INTEGER`,
    
    // Add flag to copy attachments to recurring tasks
    `ALTER TABLE tasks ADD COLUMN recurring_copy_attachments BOOLEAN DEFAULT 0`,
    
    // Add flag for skipped occurrences
    `ALTER TABLE tasks ADD COLUMN is_skipped BOOLEAN DEFAULT 0`,
    
    // Add index for recurring group
    `CREATE INDEX IF NOT EXISTS idx_recurring_group ON tasks(recurring_group_id)`,
    
    // Add index for parent task
    `CREATE INDEX IF NOT EXISTS idx_parent_task ON tasks(parent_task_id)`
  ];
  
  for (const migration of migrations) {
    try {
      await runQuery(migration);
      console.log(`✓ Executed: ${migration.substring(0, 50)}...`);
    } catch (error) {
      // Ignore "duplicate column" errors for idempotency
      if (!error.message.includes('duplicate column name')) {
        console.error(`✗ Failed: ${migration.substring(0, 50)}...`, error.message);
      } else {
        console.log(`⚠ Column already exists: ${migration.substring(0, 50)}...`);
      }
    }
  }
  
  console.log('Migration complete: Enhanced recurring tasks');
}

// Run migration if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addRecurringEnhancements()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}