import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/familytodo.db');

console.log('Adding missing recurring columns to database...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  
  console.log('Connected to database');
  
  // Add missing columns one by one (SQLite doesn't support adding multiple columns in one ALTER statement)
  const columnsToAdd = [
    { name: 'recurring_interval', type: 'INTEGER DEFAULT 1' },
    { name: 'recurring_unit', type: 'TEXT' },
    { name: 'recurring_days', type: 'TEXT' },
    { name: 'recurring_from', type: 'TEXT' },
    { name: 'recurring_end_date', type: 'DATETIME' },
    { name: 'recurring_end_count', type: 'INTEGER' },
    { name: 'recurring_copy_attachments', type: 'BOOLEAN DEFAULT 0' }
  ];
  
  let completed = 0;
  let errors = 0;
  
  columnsToAdd.forEach(column => {
    const query = `ALTER TABLE tasks ADD COLUMN ${column.name} ${column.type}`;
    
    db.run(query, (err) => {
      completed++;
      
      if (err) {
        if (err.message.includes('duplicate column name')) {
          console.log(`✓ Column ${column.name} already exists`);
        } else {
          console.error(`✗ Error adding column ${column.name}:`, err.message);
          errors++;
        }
      } else {
        console.log(`✓ Added column ${column.name}`);
      }
      
      if (completed === columnsToAdd.length) {
        if (errors > 0) {
          console.log(`\nMigration completed with ${errors} errors`);
        } else {
          console.log('\n✅ All columns added successfully!');
        }
        
        db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
          }
          process.exit(errors > 0 ? 1 : 0);
        });
      }
    });
  });
});