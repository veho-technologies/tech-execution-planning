import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getHolidaysInRange } from '@/lib/federal-holidays';
import { parseISO } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { quarter_id } = await request.json();

    if (!quarter_id) {
      return NextResponse.json(
        { error: 'quarter_id is required' },
        { status: 400 }
      );
    }

    // Fetch quarter details
    const quarter = await db
      .selectFrom('quarters')
      .selectAll()
      .where('id', '=', quarter_id)
      .executeTakeFirst();

    if (!quarter) {
      return NextResponse.json(
        { error: 'Quarter not found' },
        { status: 404 }
      );
    }

    const startDate = parseISO(quarter.startDate);
    const endDate = parseISO(quarter.endDate);

    // Get federal holidays in this quarter
    const federalHolidays = getHolidaysInRange(startDate, endDate);

    // Fetch existing holidays to avoid duplicates
    const existingHolidays = await db
      .selectFrom('holidays')
      .selectAll()
      .where('quarterId', '=', quarter_id)
      .execute();

    const existingDates = new Set(
      existingHolidays.map(h => new Date(h.holidayDate).toISOString().split('T')[0])
    );

    // Insert only new holidays
    const newHolidays = federalHolidays.filter(
      holiday => !existingDates.has(holiday.date.toISOString().split('T')[0])
    );

    if (newHolidays.length === 0) {
      return NextResponse.json({
        message: 'All federal holidays already exist for this quarter',
        added: 0,
        existing: existingHolidays.length
      });
    }

    // Insert new holidays
    for (const holiday of newHolidays) {
      await db
        .insertInto('holidays')
        .values({
          quarterId: quarter_id,
          holidayDate: holiday.date,
          description: holiday.name,
        })
        .execute();
    }

    return NextResponse.json({
      message: `Added ${newHolidays.length} federal holidays`,
      added: newHolidays.length,
      holidays: newHolidays.map(h => ({
        date: h.date.toISOString().split('T')[0],
        name: h.name
      }))
    });
  } catch (error) {
    console.error('Error auto-populating holidays:', error);
    return NextResponse.json(
      { error: 'Failed to auto-populate holidays' },
      { status: 500 }
    );
  }
}
