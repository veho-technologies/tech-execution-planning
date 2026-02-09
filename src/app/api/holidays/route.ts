import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const quarterId = searchParams.get('quarter_id');

    if (!quarterId) {
      return NextResponse.json([]);
    }

    const holidays = await db
      .selectFrom('holidays')
      .selectAll()
      .where('quarterId', '=', quarterId)
      .orderBy('holidayDate')
      .execute();

    return NextResponse.json(holidays);
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return NextResponse.json(
      { error: 'Failed to fetch holidays' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quarter_id, holiday_date, description } = body;

    const result = await db
      .insertInto('holidays')
      .values({
        quarterId: quarter_id,
        holidayDate: holiday_date,
        description: description ?? null,
      })
      .returning(['id'])
      .executeTakeFirst();

    const holiday = await db
      .selectFrom('holidays')
      .selectAll()
      .where('id', '=', result!.id)
      .executeTakeFirst();

    return NextResponse.json(holiday, { status: 201 });
  } catch (error) {
    console.error('Error creating holiday:', error);
    return NextResponse.json(
      { error: 'Failed to create holiday' },
      { status: 500 }
    );
  }
}
