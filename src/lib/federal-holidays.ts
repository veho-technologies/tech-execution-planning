/**
 * Generate US Federal Holidays for a given year
 */

// Helper to get the nth weekday of a month
function getNthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): Date {
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  const daysUntilWeekday = (weekday - firstWeekday + 7) % 7;
  const date = 1 + daysUntilWeekday + (n - 1) * 7;
  return new Date(year, month, date);
}

// Helper to get the last weekday of a month
function getLastWeekdayOfMonth(year: number, month: number, weekday: number): Date {
  const lastDay = new Date(year, month + 1, 0);
  const lastWeekday = lastDay.getDay();
  const daysBack = (lastWeekday - weekday + 7) % 7;
  return new Date(year, month, lastDay.getDate() - daysBack);
}

export interface FederalHoliday {
  date: Date;
  name: string;
}

/**
 * Major holidays commonly observed by tech companies
 * Customize this list based on your company's holiday policy
 */
export function getFederalHolidays(year: number): FederalHoliday[] {
  return [
    // New Year's Day - January 1
    {
      date: new Date(year, 0, 1),
      name: "New Year's Day"
    },
    // Memorial Day - Last Monday of May
    {
      date: getLastWeekdayOfMonth(year, 4, 1),
      name: "Memorial Day"
    },
    // Independence Day - July 4
    {
      date: new Date(year, 6, 4),
      name: "Independence Day"
    },
    // Labor Day - First Monday of September
    {
      date: getNthWeekdayOfMonth(year, 8, 1, 1),
      name: "Labor Day"
    },
    // Thanksgiving - Fourth Thursday of November
    {
      date: getNthWeekdayOfMonth(year, 10, 4, 4),
      name: "Thanksgiving"
    },
    // Day after Thanksgiving
    {
      date: new Date(getNthWeekdayOfMonth(year, 10, 4, 4).getTime() + 24 * 60 * 60 * 1000),
      name: "Day after Thanksgiving"
    },
    // Christmas - December 25
    {
      date: new Date(year, 11, 25),
      name: "Christmas"
    }
  ];
}

/**
 * Optional holidays - add these manually if your company observes them
 */
export function getOptionalHolidays(year: number): FederalHoliday[] {
  return [
    {
      date: getNthWeekdayOfMonth(year, 0, 1, 3),
      name: "Martin Luther King Jr. Day"
    },
    {
      date: getNthWeekdayOfMonth(year, 1, 1, 3),
      name: "Presidents' Day"
    },
    {
      date: new Date(year, 5, 19),
      name: "Juneteenth"
    },
    {
      date: getNthWeekdayOfMonth(year, 9, 1, 2),
      name: "Columbus Day"
    },
    {
      date: new Date(year, 10, 11),
      name: "Veterans Day"
    }
  ];
}

/**
 * Get federal holidays that fall within a date range
 */
export function getHolidaysInRange(startDate: Date, endDate: Date): FederalHoliday[] {
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  const holidays: FederalHoliday[] = [];

  // Get holidays for all years in the range
  for (let year = startYear; year <= endYear; year++) {
    const yearHolidays = getFederalHolidays(year);
    holidays.push(...yearHolidays);
  }

  // Filter to only holidays within the date range
  return holidays.filter(holiday =>
    holiday.date >= startDate && holiday.date <= endDate
  );
}
