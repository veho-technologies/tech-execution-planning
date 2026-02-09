import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const team = await db
      .selectFrom('teams')
      .selectAll()
      .where('id', '=', params.id)
      .executeTakeFirst();

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(team);
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      name,
      linear_team_id,
      total_engineers,
      ktlo_engineers,
    } = body;

    await db
      .updateTable('teams')
      .set({
        name,
        linearTeamId: linear_team_id ?? null,
        totalEngineers: total_engineers,
        ktloEngineers: ktlo_engineers,
      })
      .where('id', '=', params.id)
      .execute();

    const team = await db
      .selectFrom('teams')
      .selectAll()
      .where('id', '=', params.id)
      .executeTakeFirstOrThrow();

    return NextResponse.json(team);
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json(
      { error: 'Failed to update team' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db
      .deleteFrom('teams')
      .where('id', '=', params.id)
      .execute();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    );
  }
}
