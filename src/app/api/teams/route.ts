import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const teams = await db
      .selectFrom('teams')
      .selectAll()
      .orderBy('name')
      .execute();

    return NextResponse.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      linear_team_id,
      total_engineers,
      ktlo_engineers,
    } = body;

    await db
      .insertInto('teams')
      .values({
        id,
        name,
        linearTeamId: linear_team_id ?? null,
        totalEngineers: total_engineers ?? 0,
        ktloEngineers: ktlo_engineers ?? 0,
      })
      .execute();

    const team = await db
      .selectFrom('teams')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirstOrThrow();

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    );
  }
}
