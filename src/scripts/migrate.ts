import * as path from 'path';
import { promises as fs } from 'fs';
import { config } from 'dotenv';
import { Kysely, Migrator, FileMigrationProvider } from 'kysely';
import { getDbConnection } from '../lib/database';

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') });

async function migrateToLatest() {
  const db = getDbConnection();

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, '../migrations'),
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`✓ Migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === 'Error') {
      console.error(`✗ Failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    console.error('Failed to migrate');
    console.error(error);
    process.exit(1);
  }

  await db.destroy();
  console.log('\n✓ All migrations completed successfully');
}

async function migrateDown() {
  const db = getDbConnection();

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, '../migrations'),
    }),
  });

  const { error, results } = await migrator.migrateDown();

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`✓ Migration "${it.migrationName}" was rolled back successfully`);
    } else if (it.status === 'Error') {
      console.error(`✗ Failed to rollback migration "${it.migrationName}"`);
    }
  });

  if (error) {
    console.error('Failed to migrate down');
    console.error(error);
    process.exit(1);
  }

  await db.destroy();
}

const command = process.argv[2];

if (command === 'down') {
  migrateDown();
} else {
  migrateToLatest();
}
