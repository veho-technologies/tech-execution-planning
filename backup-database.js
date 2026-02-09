const { Pool } = require('pg');
const fs = require('fs');

async function backup() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/capacity_planner'
  });

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_').substring(0, 19);
    const backupDir = 'backups';

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    const backup = {
      timestamp: new Date().toISOString(),
      tables: {}
    };

    console.log('Creating database backup...\n');

    // Get all tables
    const tables = ['quarters', 'teams', 'holidays', 'sprints', 'projects', 'sprint_allocations', 'pto_entries', 'team_quarter_settings'];

    for (const table of tables) {
      const result = await pool.query(`SELECT * FROM ${table}`);
      backup.tables[table] = result.rows;
      console.log(`✓ Backed up ${table}: ${result.rows.length} rows`);
    }

    const filename = `${backupDir}/capacity_planner_${timestamp}.json`;
    fs.writeFileSync(filename, JSON.stringify(backup, null, 2));

    console.log(`\n✓ Backup saved to: ${filename}`);
    console.log(`File size: ${(fs.statSync(filename).size / 1024).toFixed(2)} KB`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

backup();
