/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Teams table
  await db.schema
    .createTable('teams')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('linear_team_id', 'text', (col) => col.unique())
    .addColumn('total_engineers', 'real', (col) => col.defaultTo(0))
    .addColumn('ktlo_engineers', 'real', (col) => col.defaultTo(0))
    .addColumn('created_at', sql`timestamp with time zone`, (col) => col.defaultTo(sql`now()`))
    .addColumn('updated_at', sql`timestamp with time zone`, (col) => col.defaultTo(sql`now()`))
    .execute();

  // Quarters table
  await db.schema
    .createTable('quarters')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('start_date', 'date', (col) => col.notNull())
    .addColumn('end_date', 'date', (col) => col.notNull())
    .addColumn('pto_days_per_engineer', 'real', (col) => col.defaultTo(5))
    .addColumn('meeting_time_percentage', 'real', (col) => col.defaultTo(0.25))
    .addColumn('work_days_per_week', 'integer', (col) => col.defaultTo(5))
    .addColumn('created_at', sql`timestamp with time zone`, (col) => col.defaultTo(sql`now()`))
    .addColumn('updated_at', sql`timestamp with time zone`, (col) => col.defaultTo(sql`now()`))
    .execute();

  // Holidays table
  await db.schema
    .createTable('holidays')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('quarter_id', 'text', (col) => col.notNull().references('quarters.id').onDelete('cascade'))
    .addColumn('holiday_date', 'date', (col) => col.notNull())
    .addColumn('description', 'text')
    .execute();

  // Sprints table
  await db.schema
    .createTable('sprints')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('quarter_id', 'text', (col) => col.notNull().references('quarters.id').onDelete('cascade'))
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('start_date', 'date', (col) => col.notNull())
    .addColumn('end_date', 'date', (col) => col.notNull())
    .addColumn('sprint_number', 'integer', (col) => col.notNull())
    .addColumn('created_at', sql`timestamp with time zone`, (col) => col.defaultTo(sql`now()`))
    .execute();

  // Projects table
  await db.schema
    .createTable('projects')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('linear_issue_id', 'text', (col) => col.unique().notNull())
    .addColumn('team_id', 'text', (col) => col.notNull().references('teams.id').onDelete('cascade'))
    .addColumn('quarter_id', 'text', (col) => col.notNull().references('quarters.id').onDelete('cascade'))
    .addColumn('planned_weeks', 'real', (col) => col.defaultTo(0))
    .addColumn('internal_timeline', 'date')
    .addColumn('has_frm', 'boolean', (col) => col.defaultTo(false))
    .addColumn('notes', 'text')
    .addColumn('dependencies', 'text')
    .addColumn('created_at', sql`timestamp with time zone`, (col) => col.defaultTo(sql`now()`))
    .addColumn('updated_at', sql`timestamp with time zone`, (col) => col.defaultTo(sql`now()`))
    .execute();

  // Sprint allocations table
  await db.schema
    .createTable('sprint_allocations')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('project_id', 'text', (col) => col.notNull().references('projects.id').onDelete('cascade'))
    .addColumn('sprint_id', 'text', (col) => col.notNull().references('sprints.id').onDelete('cascade'))
    .addColumn('planned_days', 'real', (col) => col.defaultTo(0))
    .addColumn('actual_days', 'real', (col) => col.defaultTo(0))
    .addColumn('planned_description', 'text')
    .addColumn('engineers_assigned', 'text')
    .addColumn('phase', 'text', (col) => col.defaultTo('Execution'))
    .addColumn('sprint_goal', 'text')
    .addColumn('num_engineers', 'real', (col) => col.defaultTo(0))
    .addColumn('is_manual_override', 'boolean', (col) => col.defaultTo(false))
    .addColumn('created_at', sql`timestamp with time zone`, (col) => col.defaultTo(sql`now()`))
    .addColumn('updated_at', sql`timestamp with time zone`, (col) => col.defaultTo(sql`now()`))
    .execute();

  // Add unique constraint
  await db.schema
    .createIndex('sprint_allocations_project_sprint_unique')
    .on('sprint_allocations')
    .columns(['project_id', 'sprint_id'])
    .unique()
    .execute();

  // Capacity snapshots table
  await db.schema
    .createTable('capacity_snapshots')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('team_id', 'text', (col) => col.notNull().references('teams.id').onDelete('cascade'))
    .addColumn('quarter_id', 'text', (col) => col.notNull().references('quarters.id').onDelete('cascade'))
    .addColumn('sprint_id', 'text', (col) => col.references('sprints.id').onDelete('set null'))
    .addColumn('snapshot_date', sql`timestamp with time zone`, (col) => col.defaultTo(sql`now()`))
    .addColumn('total_capacity_days', 'real')
    .addColumn('allocated_days', 'real')
    .addColumn('available_days', 'real')
    .addColumn('pto_adjustments', 'real', (col) => col.defaultTo(0))
    .addColumn('notes', 'text')
    .execute();

  // Sprint snapshots table
  await db.schema
    .createTable('sprint_snapshots')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('sprint_id', 'text', (col) => col.notNull().references('sprints.id').onDelete('cascade'))
    .addColumn('snapshot_date', sql`timestamp with time zone`, (col) => col.defaultTo(sql`now()`))
    .addColumn('snapshot_data', 'text', (col) => col.notNull())
    .addColumn('notes', 'text')
    .addColumn('created_by', 'text')
    .execute();

  // PTO entries table
  await db.schema
    .createTable('pto_entries')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('team_id', 'text', (col) => col.notNull().references('teams.id').onDelete('cascade'))
    .addColumn('engineer_name', 'text', (col) => col.notNull())
    .addColumn('start_date', 'date', (col) => col.notNull())
    .addColumn('end_date', 'date', (col) => col.notNull())
    .addColumn('days_count', 'real', (col) => col.notNull())
    .addColumn('quarter_id', 'text', (col) => col.notNull().references('quarters.id').onDelete('cascade'))
    .addColumn('notes', 'text')
    .addColumn('created_at', sql`timestamp with time zone`, (col) => col.defaultTo(sql`now()`))
    .execute();

  // Team quarter settings table
  await db.schema
    .createTable('team_quarter_settings')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('team_id', 'text', (col) => col.notNull().references('teams.id').onDelete('cascade'))
    .addColumn('quarter_id', 'text', (col) => col.notNull().references('quarters.id').onDelete('cascade'))
    .addColumn('total_engineers', 'real', (col) => col.defaultTo(0))
    .addColumn('ktlo_engineers', 'real', (col) => col.defaultTo(0))
    .addColumn('created_at', sql`timestamp with time zone`, (col) => col.defaultTo(sql`now()`))
    .addColumn('updated_at', sql`timestamp with time zone`, (col) => col.defaultTo(sql`now()`))
    .execute();

  // Add unique constraint
  await db.schema
    .createIndex('team_quarter_settings_team_quarter_unique')
    .on('team_quarter_settings')
    .columns(['team_id', 'quarter_id'])
    .unique()
    .execute();

  // Create indexes
  await db.schema
    .createIndex('idx_projects_team')
    .on('projects')
    .column('team_id')
    .execute();

  await db.schema
    .createIndex('idx_projects_quarter')
    .on('projects')
    .column('quarter_id')
    .execute();

  await db.schema
    .createIndex('idx_sprints_quarter')
    .on('sprints')
    .column('quarter_id')
    .execute();

  await db.schema
    .createIndex('idx_allocations_project')
    .on('sprint_allocations')
    .column('project_id')
    .execute();

  await db.schema
    .createIndex('idx_allocations_sprint')
    .on('sprint_allocations')
    .column('sprint_id')
    .execute();

  await db.schema
    .createIndex('idx_snapshots_sprint')
    .on('sprint_snapshots')
    .column('sprint_id')
    .execute();

  await db.schema
    .createIndex('idx_pto_team_quarter')
    .on('pto_entries')
    .columns(['team_id', 'quarter_id'])
    .execute();

  await db.schema
    .createIndex('idx_team_quarter_settings')
    .on('team_quarter_settings')
    .columns(['team_id', 'quarter_id'])
    .execute();

  // Create updated_at trigger function
  await sql`
    CREATE OR REPLACE FUNCTION updated_at_trigger()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW."updated_at" = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `.execute(db);

  // Add updated_at triggers to tables
  const tablesWithUpdatedAt = ['teams', 'quarters', 'projects', 'sprint_allocations', 'team_quarter_settings'];

  for (const table of tablesWithUpdatedAt) {
    await sql`
      CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON ${sql.table(table)}
      FOR EACH ROW
      EXECUTE FUNCTION updated_at_trigger();
    `.execute(db);
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop tables in reverse order (respecting foreign keys)
  await db.schema.dropTable('team_quarter_settings').ifExists().execute();
  await db.schema.dropTable('pto_entries').ifExists().execute();
  await db.schema.dropTable('sprint_snapshots').ifExists().execute();
  await db.schema.dropTable('capacity_snapshots').ifExists().execute();
  await db.schema.dropTable('sprint_allocations').ifExists().execute();
  await db.schema.dropTable('projects').ifExists().execute();
  await db.schema.dropTable('sprints').ifExists().execute();
  await db.schema.dropTable('holidays').ifExists().execute();
  await db.schema.dropTable('quarters').ifExists().execute();
  await db.schema.dropTable('teams').ifExists().execute();

  // Drop trigger function
  await sql`DROP FUNCTION IF EXISTS updated_at_trigger();`.execute(db);
}
