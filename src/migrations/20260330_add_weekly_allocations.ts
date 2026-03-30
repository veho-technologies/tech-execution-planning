/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Add week_start_date column to sprint_allocations
  await db.schema
    .alterTable('sprint_allocations')
    .addColumn('week_start_date', 'date')
    .execute();

  // Drop existing unique index
  await db.schema
    .dropIndex('sprint_allocations_project_sprint_unique')
    .execute();

  // Create new unique index using COALESCE to handle NULL week_start_date
  await sql`
    CREATE UNIQUE INDEX sprint_allocations_project_sprint_week_unique
    ON sprint_allocations (project_id, sprint_id, COALESCE(week_start_date, '1970-01-01'))
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop the new unique index
  await db.schema
    .dropIndex('sprint_allocations_project_sprint_week_unique')
    .execute();

  // Restore original unique index
  await db.schema
    .createIndex('sprint_allocations_project_sprint_unique')
    .on('sprint_allocations')
    .columns(['project_id', 'sprint_id'])
    .unique()
    .execute();

  // Remove week_start_date column
  await db.schema
    .alterTable('sprint_allocations')
    .dropColumn('week_start_date')
    .execute();
}
