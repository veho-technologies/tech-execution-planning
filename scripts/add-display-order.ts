/**
 * Add display_order column to projects table for custom row ordering
 */

import { sql } from 'kysely';
import { getSingletonDbConnection } from '../src/lib/database';

async function addDisplayOrder() {
  const db = getSingletonDbConnection();

  try {
    console.log('Adding display_order column to projects table...');

    await sql`
      ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0
    `.execute(db);

    console.log('✓ Added display_order column');
    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await db.destroy();
  }
}

addDisplayOrder()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
