import * as path from 'path';
import { promises as fs } from 'fs';
import { config } from 'dotenv';
import { Pool } from 'pg';

// Load environment variables from .env.local (local dev) or from CI env vars
config({ path: path.join(process.cwd(), '.env.local') });

async function seed() {
  const pool = new Pool({
    host: process.env.DATABASE_HOST || 'localhost',
    port: +(process.env.DATABASE_PORT ?? 5432),
    database: process.env.DATABASE_NAME || 'capacity_planner',
    user: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    ssl: process.env.DATABASE_DISABLE_SSL === 'true'
      ? false
      : { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();
    console.log('Connected to database');

    // Check if data already exists
    const { rows } = await client.query('SELECT count(*) as count FROM teams');
    if (parseInt(rows[0].count) > 0) {
      console.log('Database already has data, skipping seed');
      client.release();
      await pool.end();
      return;
    }

    // Look for seed.sql relative to project root
    const sqlFile = path.join(process.cwd(), 'data', 'seed.sql');
    console.log(`Reading seed file: ${sqlFile}`);
    const sql = await fs.readFile(sqlFile, 'utf-8');

    // Execute each statement (split on semicolons, but be careful with strings)
    const statements = sql
      .split(/;\s*$/m)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} statements to execute`);

    for (const stmt of statements) {
      try {
        await client.query(stmt);
      } catch (err: any) {
        console.error(`Error executing statement: ${err.message}`);
        console.error(`Statement: ${stmt.substring(0, 100)}...`);
      }
    }

    console.log('Seed data loaded successfully');
    client.release();
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
