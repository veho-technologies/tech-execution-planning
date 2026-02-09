/**
 * Database Migration Script
 * Adds new columns to sprint_allocations table for enhanced sprint allocation features
 *
 * Run with: node migrate-db.js
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'planner.db');

console.log(`Migrating database at: ${dbPath}`);

const db = new Database(dbPath);

try {
  // Check if columns already exist
  const tableInfo = db.prepare("PRAGMA table_info(sprint_allocations)").all();
  const existingColumns = tableInfo.map(col => col.name);

  const columnsToAdd = [
    { name: 'phase', sql: "ALTER TABLE sprint_allocations ADD COLUMN phase TEXT DEFAULT 'Execution'" },
    { name: 'sprint_goal', sql: "ALTER TABLE sprint_allocations ADD COLUMN sprint_goal TEXT" },
    { name: 'num_engineers', sql: "ALTER TABLE sprint_allocations ADD COLUMN num_engineers REAL DEFAULT 0" },
    { name: 'is_manual_override', sql: "ALTER TABLE sprint_allocations ADD COLUMN is_manual_override BOOLEAN DEFAULT 0" },
  ];

  let migrationsRun = 0;

  for (const column of columnsToAdd) {
    if (!existingColumns.includes(column.name)) {
      console.log(`Adding column: ${column.name}`);
      db.exec(column.sql);
      migrationsRun++;
    } else {
      console.log(`Column ${column.name} already exists, skipping`);
    }
  }

  if (migrationsRun > 0) {
    console.log(`\n✓ Migration complete! Added ${migrationsRun} new column(s).`);
  } else {
    console.log('\n✓ Database is already up to date.');
  }

} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}
