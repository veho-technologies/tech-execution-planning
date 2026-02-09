import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const quarterId = searchParams.get('quarter_id');
    const teamId = searchParams.get('team_id');

    let query = db.selectFrom('ptoEntries').selectAll();

    if (quarterId) {
      query = query.where('quarterId', '=', quarterId);
    }

    if (teamId) {
      query = query.where('teamId', '=', teamId);
    }

    const ptoEntries = await query.orderBy('startDate').execute();

    return NextResponse.json(ptoEntries);
  } catch (error) {
    console.error('Error fetching PTO entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PTO entries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      team_id,
      engineer_name,
      start_date,
      end_date,
      days_count,
      quarter_id,
      notes,
    } = body;

    const result = await db
      .insertInto('ptoEntries')
      .values({
        teamId: team_id,
        engineerName: engineer_name,
        startDate: start_date,
        endDate: end_date,
        daysCount: days_count,
        quarterId: quarter_id,
        notes: notes ?? null,
      })
      .returning(['id'])
      .executeTakeFirst();

    const pto = await db
      .selectFrom('ptoEntries')
      .selectAll()
      .where('id', '=', result!.id)
      .executeTakeFirst();

    return NextResponse.json(pto, { status: 201 });
  } catch (error) {
    console.error('Error creating PTO entry:', error);
    return NextResponse.json(
      { error: 'Failed to create PTO entry' },
      { status: 500 }
    );
  }
}
