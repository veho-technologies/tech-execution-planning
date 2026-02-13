import { NextResponse } from 'next/server';
import { sql } from 'kysely';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const diagnostics: Record<string, unknown> = {
    status: 'ok',
    env: {
      DATABASE_HOST: process.env.DATABASE_HOST || '(not set)',
      DATABASE_PORT: process.env.DATABASE_PORT || '(not set)',
      DATABASE_NAME: process.env.DATABASE_NAME || '(not set)',
      DATABASE_USERNAME: process.env.DATABASE_USERNAME || '(not set)',
      DATABASE_PASSWORD: process.env.DATABASE_PASSWORD ? '***set***' : '(not set)',
      DATABASE_DISABLE_SSL: process.env.DATABASE_DISABLE_SSL || '(not set)',
      NODE_ENV: process.env.NODE_ENV || '(not set)',
    },
  };

  try {
    const result = await sql`SELECT 1 as connected`.execute(db);
    diagnostics.db = { connected: true, result: result.rows };

    const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`.execute(db);
    diagnostics.tables = tables.rows;

    const teamCount = await sql`SELECT count(*) as count FROM teams`.execute(db);
    diagnostics.teamCount = teamCount.rows;
  } catch (error: any) {
    diagnostics.db = {
      connected: false,
      error: error.message,
      code: error.code,
    };
  }

  return NextResponse.json(diagnostics);
}
