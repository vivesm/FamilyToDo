import { initDatabase } from '../db/database.js';

console.log('Initializing FamilyToDo database...');

initDatabase()
  .then(() => {
    console.log('✅ Database initialized successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  });