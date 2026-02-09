import db from './db';
import { getHolidaysForDateRange } from './holidays';

export function generateQuarters(startYear: number, endYear: number) {
  const quarters = [];

  for (let year = startYear; year <= endYear; year++) {
    quarters.push(
      {
        id: `q1-${year}`,
        name: `Q1 ${year}`,
        start_date: `${year}-01-01`,
        end_date: `${year}-03-31`,
      },
      {
        id: `q2-${year}`,
        name: `Q2 ${year}`,
        start_date: `${year}-04-01`,
        end_date: `${year}-06-30`,
      },
      {
        id: `q3-${year}`,
        name: `Q3 ${year}`,
        start_date: `${year}-07-01`,
        end_date: `${year}-09-30`,
      },
      {
        id: `q4-${year}`,
        name: `Q4 ${year}`,
        start_date: `${year}-10-01`,
        end_date: `${year}-12-31`,
      }
    );
  }

  return quarters;
}

export async function initializeQuarters() {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  // Generate quarters for current and next 2 years
  const quarters = generateQuarters(currentYear, nextYear + 1);

  for (const quarter of quarters) {
    // Insert quarter with default values
    await db
      .insertInto('quarters')
      .values({
        id: quarter.id,
        name: quarter.name,
        startDate: quarter.start_date,
        endDate: quarter.end_date,
        ptoDaysPerEngineer: 5, // Default 5 PTO days
        meetingTimePercentage: 0.25, // Default 25% meeting time
        workDaysPerWeek: 5, // Default 5 work days per week
      })
      .onConflict((oc) => oc.column('id').doNothing())
      .execute();

    // Add US holidays for this quarter
    const startDate = new Date(quarter.start_date);
    const endDate = new Date(quarter.end_date);
    const holidays = getHolidaysForDateRange(startDate, endDate);

    for (const holiday of holidays) {
      // Check if holiday already exists
      const existing = await db
        .selectFrom('holidays')
        .select('id')
        .where('quarterId', '=', quarter.id)
        .where('holidayDate', '=', holiday.date)
        .executeTakeFirst();

      if (!existing) {
        await db
          .insertInto('holidays')
          .values({
            quarterId: quarter.id,
            holidayDate: holiday.date,
            description: holiday.description,
          })
          .execute();
      }
    }
  }

  console.log(`Initialized ${quarters.length} quarters with US federal holidays`);
}
