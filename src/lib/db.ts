/**
 * Database connection module
 *
 * This file now uses PostgreSQL with Kysely instead of SQLite with better-sqlite3.
 * The database connection is managed through the database.ts module which provides
 * a singleton Kysely instance.
 *
 * For backward compatibility, we export the db connection the same way,
 * but now it's a Kysely instance instead of better-sqlite3 Database.
 */

import { getSingletonDbConnection } from './database';

// Export the database connection
// This is a Kysely instance with type-safe queries
const db = getSingletonDbConnection();

// Database is initialized via migrations (npm run migrate)
// No longer need initializeDatabase function as schema is managed by migrations

export default db;
