/**
 * Migration script to fix the projects table unique constraint
 *
 * Changes:
 * - Remove unique constraint on linearIssueId alone
 * - Add composite unique constraint on (linearIssueId, quarterId)
 *
 * This allows the same Linear issue to exist in multiple quarters
 */

import { sql } from 'kysely';
import { getSingletonDbConnection } from '../src/lib/database';

async function fixProjectConstraint() {
  const db = getSingletonDbConnection();

  try {
    console.log('Starting migration: fixing project constraints...');

    // Drop the existing unique constraint on linearIssueId
    await sql`
      ALTER TABLE projects
      DROP CONSTRAINT IF EXISTS projects_linear_issue_id_key
    `.execute(db);

    console.log('✓ Dropped unique constraint on linearIssueId');

    // Add composite unique constraint on (linearIssueId, quarterId)
    await sql`
      ALTER TABLE projects
      ADD CONSTRAINT projects_linear_issue_id_quarter_id_key
      UNIQUE (linear_issue_id, quarter_id)
    `.execute(db);

    console.log('✓ Added composite unique constraint on (linearIssueId, quarterId)');
    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await db.destroy();
  }
}

fixProjectConstraint()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
