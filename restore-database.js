const { Pool } = require('pg');
const fs = require('fs');

async function restore() {
  const backupFile = process.argv[2] || 'backups/capacity_planner_2026-02-09_22-12-07.json';

  if (!fs.existsSync(backupFile)) {
    console.error(`Backup file not found: ${backupFile}`);
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/capacity_planner'
  });

  try {
    const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

    console.log(`\n📦 Restoring from backup: ${backupFile}`);
    console.log(`Backup timestamp: ${backup.timestamp}\n`);

    // Confirm before proceeding
    console.log('⚠️  WARNING: This will DELETE ALL current data and restore from backup!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Delete data in reverse order (respecting foreign keys)
    const tables = ['sprint_allocations', 'pto_entries', 'sprints', 'projects', 'team_quarter_settings', 'holidays', 'teams', 'quarters'];

    console.log('🗑️  Clearing existing data...\n');
    for (const table of tables) {
      await pool.query(`DELETE FROM ${table}`);
      console.log(`  ✓ Cleared ${table}`);
    }

    // Restore data in order
    const restoreTables = ['quarters', 'teams', 'holidays', 'sprints', 'projects', 'sprint_allocations', 'pto_entries', 'team_quarter_settings'];

    console.log('\n📥 Restoring data...\n');
    for (const table of restoreTables) {
      const rows = backup.tables[table] || [];

      if (rows.length === 0) {
        console.log(`  ⊘ ${table}: No data to restore`);
        continue;
      }

      for (const row of rows) {
        const columns = Object.keys(row);
        const values = columns.map(col => row[col]);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

        await pool.query(
          `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
          values
        );
      }

      console.log(`  ✓ ${table}: Restored ${rows.length} rows`);
    }

    console.log('\n✅ Database restored successfully!\n');
    console.log('Summary:');
    restoreTables.forEach(table => {
      const count = backup.tables[table]?.length || 0;
      console.log(`  - ${table}: ${count} rows`);
    });

  } catch (error) {
    console.error('\n❌ Error restoring database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

restore();
