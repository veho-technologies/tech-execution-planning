import { CamelCasePlugin, Kysely, LogEvent, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import type { DB } from '@/types/db';

export function getDataSourceOptions() {
  const dbConfig = {
    host: process.env.DATABASE_HOST || 'localhost',
    port: +(process.env.DATABASE_PORT ?? 5432),
    database: process.env.DATABASE_NAME || 'capacity_planner',
    user: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    min: +(process.env.DATABASE_POOL_MIN ?? 0),
    max: +(process.env.DATABASE_POOL_MAX ?? 10),
  };

  return {
    pool: new Pool({
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      password: dbConfig.password,
      min: dbConfig.min,
      max: dbConfig.max,
      ssl: process.env.DATABASE_DISABLE_SSL === 'true'
        ? false
        : { rejectUnauthorized: false },
    }),
  };
}

export const getDbConnection = () => {
  return new Kysely<DB>({
    dialect: new PostgresDialect(getDataSourceOptions()),
    plugins: [new CamelCasePlugin()],
    log(event: LogEvent): void {
      if (event.level === 'query') {
        console.log('SQL query:', {
          sql: event.query.sql,
          parameters: event.query.parameters,
        });
      }
      if (event.level === 'error') {
        console.error('SQL ERROR:', {
          sql: event.query.sql,
          parameters: event.query.parameters,
          error: event.error,
        });
      }
    },
  });
};

let kyselyInstance: Kysely<DB> | undefined;

export const getSingletonDbConnection = () => {
  if (!kyselyInstance) {
    kyselyInstance = getDbConnection();
  }
  return kyselyInstance;
};

// For compatibility - can be used in API routes
const db = getSingletonDbConnection();
export default db;
