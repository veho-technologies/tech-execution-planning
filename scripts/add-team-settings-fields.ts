/**
 * Add meeting_time_percentage and pto_days_per_engineer to team_quarter_settings table
 */

import { sql } from 'kysely';
import { getSingletonDbConnection } from '../src/lib/database';

async function addTeamSettingsFields() {
  const db = getSingletonDbConnection();

  try {
    console.log('Adding new fields to team_quarter_settings table...');

    // Add meeting_time_percentage column (default 0.2 = 20%)
    await sql`
      ALTER TABLE team_quarter_settings
      ADD COLUMN IF NOT EXISTS meeting_time_percentage REAL DEFAULT 0.2
    `.execute(db);

    console.log('✓ Added meeting_time_percentage column');

    // Add pto_days_per_engineer column (default 0)
    await sql`
      ALTER TABLE team_quarter_settings
      ADD COLUMN IF NOT EXISTS pto_days_per_engineer REAL DEFAULT 0
    `.execute(db);

    console.log('✓ Added pto_days_per_engineer column');
    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await db.destroy();
  }
}

addTeamSettingsFields()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
