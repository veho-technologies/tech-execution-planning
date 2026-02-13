import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const team_id = searchParams.get('team_id');
    const quarter_id = searchParams.get('quarter_id');

    let query = db.selectFrom('teamQuarterSettings').selectAll();

    if (team_id) {
      query = query.where('teamId', '=', team_id);
    }

    if (quarter_id) {
      query = query.where('quarterId', '=', quarter_id);
    }

    const settings = await query.execute();

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching team quarter settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team quarter settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      team_id,
      quarter_id,
      total_engineers,
      ktlo_engineers,
      meeting_time_percentage,
      pto_days_per_engineer,
    } = body;

    // Upsert: insert or update if exists
    await db
      .insertInto('teamQuarterSettings')
      .values({
        teamId: team_id,
        quarterId: quarter_id,
        totalEngineers: total_engineers ?? 0,
        ktloEngineers: ktlo_engineers ?? 0,
        meetingTimePercentage: meeting_time_percentage ?? 0.2,
        ptoDaysPerEngineer: pto_days_per_engineer ?? 0,
      })
      .onConflict((oc) =>
        oc.columns(['teamId', 'quarterId']).doUpdateSet({
          totalEngineers: total_engineers ?? 0,
          ktloEngineers: ktlo_engineers ?? 0,
          meetingTimePercentage: meeting_time_percentage ?? 0.2,
          ptoDaysPerEngineer: pto_days_per_engineer ?? 0,
        })
      )
      .execute();

    const setting = await db
      .selectFrom('teamQuarterSettings')
      .selectAll()
      .where('teamId', '=', team_id)
      .where('quarterId', '=', quarter_id)
      .executeTakeFirst();

    return NextResponse.json(setting, { status: 201 });
  } catch (error) {
    console.error('Error creating/updating team quarter settings:', error);
    return NextResponse.json(
      { error: 'Failed to create/update team quarter settings' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    await db.deleteFrom('teamQuarterSettings').where('id', '=', Number(id)).execute();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting team quarter settings:', error);
    return NextResponse.json(
      { error: 'Failed to delete team quarter settings' },
      { status: 500 }
    );
  }
}
