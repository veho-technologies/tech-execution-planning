/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Add display_order to projects
  await db.schema
    .alterTable('projects')
    .addColumn('display_order', 'integer', (col) => col.defaultTo(0))
    .execute();

  // Drop unique constraint on linear_issue_id - same project can appear in multiple quarters
  await sql`ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_linear_issue_id_key`.execute(db);

  // Add meeting_time_percentage and pto_days_per_engineer to team_quarter_settings
  await db.schema
    .alterTable('team_quarter_settings')
    .addColumn('meeting_time_percentage', 'real', (col) => col.defaultTo(0.25))
    .execute();

  await db.schema
    .alterTable('team_quarter_settings')
    .addColumn('pto_days_per_engineer', 'real', (col) => col.defaultTo(5))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('projects').dropColumn('display_order').execute();
  await sql`ALTER TABLE projects ADD CONSTRAINT projects_linear_issue_id_key UNIQUE (linear_issue_id)`.execute(db);
  await db.schema.alterTable('team_quarter_settings').dropColumn('meeting_time_percentage').execute();
  await db.schema.alterTable('team_quarter_settings').dropColumn('pto_days_per_engineer').execute();
}
