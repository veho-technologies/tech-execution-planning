import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // Calculate current quarter
    const currentQuarter = Math.floor(currentMonth / 3) + 1;

    // Calculate -1 quarter (previous quarter)
    let minYear = currentYear;
    let minQuarter = currentQuarter - 1;
    if (minQuarter < 1) {
      minQuarter = 4;
      minYear = currentYear - 1;
    }
    const minDate = `${minYear}-${String((minQuarter - 1) * 3 + 1).padStart(2, '0')}-01`;

    // Calculate +1 year from today
    const maxDate = new Date(currentYear + 1, currentMonth, today.getDate());
    const maxDateStr = maxDate.toISOString().split('T')[0];

    const quarters = await db
      .selectFrom('quarters')
      .selectAll()
      .where('startDate', '>=', minDate)
      .where('startDate', '<=', maxDateStr)
      .orderBy('startDate', 'asc')
      .execute();

    return NextResponse.json(quarters);
  } catch (error) {
    console.error('Error fetching quarters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quarters' },
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
      start_date,
      end_date,
      pto_days_per_engineer,
      meeting_time_percentage,
      work_days_per_week,
    } = body;

    await db
      .insertInto('quarters')
      .values({
        id,
        name,
        startDate: start_date,
        endDate: end_date,
        ptoDaysPerEngineer: pto_days_per_engineer ?? 5,
        meetingTimePercentage: meeting_time_percentage ?? 0.25,
        workDaysPerWeek: work_days_per_week ?? 5,
      })
      .execute();

    const quarter = await db
      .selectFrom('quarters')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return NextResponse.json(quarter, { status: 201 });
  } catch (error) {
    console.error('Error creating quarter:', error);
    return NextResponse.json(
      { error: 'Failed to create quarter' },
      { status: 500 }
    );
  }
}
