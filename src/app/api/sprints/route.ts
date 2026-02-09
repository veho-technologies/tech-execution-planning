import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const quarterId = searchParams.get('quarter_id');

    if (!quarterId) {
      return NextResponse.json(
        { error: 'quarter_id is required' },
        { status: 400 }
      );
    }

    const sprints = await db
      .selectFrom('sprints')
      .selectAll()
      .where('quarterId', '=', quarterId)
      .orderBy('sprintNumber', 'asc')
      .execute();

    return NextResponse.json(sprints);
  } catch (error) {
    console.error('Error fetching sprints:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sprints' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, quarter_id, name, start_date, end_date, sprint_number } = body;

    // Use onConflict for upsert behavior (INSERT OR REPLACE)
    await db
      .insertInto('sprints')
      .values({
        id,
        quarterId: quarter_id,
        name,
        startDate: start_date,
        endDate: end_date,
        sprintNumber: sprint_number,
      })
      .onConflict((oc) =>
        oc.column('id').doUpdateSet({
          quarterId: quarter_id,
          name,
          startDate: start_date,
          endDate: end_date,
          sprintNumber: sprint_number,
        })
      )
      .execute();

    const sprint = await db
      .selectFrom('sprints')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return NextResponse.json(sprint, { status: 201 });
  } catch (error) {
    console.error('Error creating sprint:', error);
    return NextResponse.json(
      { error: 'Failed to create sprint' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const quarterId = searchParams.get('quarter_id');

    if (!quarterId) {
      return NextResponse.json(
        { error: 'quarter_id is required' },
        { status: 400 }
      );
    }

    // Delete all sprints for this quarter
    await db
      .deleteFrom('sprints')
      .where('quarterId', '=', quarterId)
      .execute();

    return NextResponse.json({ success: true, message: 'Sprints deleted' });
  } catch (error) {
    console.error('Error deleting sprints:', error);
    return NextResponse.json(
      { error: 'Failed to delete sprints' },
      { status: 500 }
    );
  }
}
