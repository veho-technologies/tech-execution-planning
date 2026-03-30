/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Add display_order to projects (idempotent)
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0`.execute(db);

  // Drop unique constraint on linear_issue_id - same project can appear in multiple quarters
  await sql`ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_linear_issue_id_key`.execute(db);

  // Add meeting_time_percentage and pto_days_per_engineer to team_quarter_settings (idempotent)
  await sql`ALTER TABLE team_quarter_settings ADD COLUMN IF NOT EXISTS meeting_time_percentage real DEFAULT 0.25`.execute(db);
  await sql`ALTER TABLE team_quarter_settings ADD COLUMN IF NOT EXISTS pto_days_per_engineer real DEFAULT 5`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('projects').dropColumn('display_order').execute();
  await sql`ALTER TABLE projects ADD CONSTRAINT projects_linear_issue_id_key UNIQUE (linear_issue_id)`.execute(db);
  await db.schema.alterTable('team_quarter_settings').dropColumn('meeting_time_percentage').execute();
  await db.schema.alterTable('team_quarter_settings').dropColumn('pto_days_per_engineer').execute();
}
