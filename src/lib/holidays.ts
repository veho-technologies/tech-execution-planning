// US Federal Holidays
export function getUSFederalHolidays(year: number): { date: string; description: string }[] {
  const holidays: { date: string; description: string }[] = [];

  // Fixed date holidays
  holidays.push(
    { date: `${year}-01-01`, description: "New Year's Day" },
    { date: `${year}-06-19`, description: "Juneteenth" },
    { date: `${year}-07-04`, description: "Independence Day" },
    { date: `${year}-11-11`, description: "Veterans Day" },
    { date: `${year}-12-25`, description: "Christmas Day" }
  );

  // Martin Luther King Jr. Day - Third Monday in January
  const mlkDay = getNthWeekdayOfMonth(year, 0, 1, 3); // January, Monday, 3rd
  holidays.push({ date: mlkDay, description: "Martin Luther King Jr. Day" });

  // Presidents' Day - Third Monday in February
  const presidentsDay = getNthWeekdayOfMonth(year, 1, 1, 3); // February, Monday, 3rd
  holidays.push({ date: presidentsDay, description: "Presidents' Day" });

  // Memorial Day - Last Monday in May
  const memorialDay = getLastWeekdayOfMonth(year, 4, 1); // May, Monday
  holidays.push({ date: memorialDay, description: "Memorial Day" });

  // Labor Day - First Monday in September
  const laborDay = getNthWeekdayOfMonth(year, 8, 1, 1); // September, Monday, 1st
  holidays.push({ date: laborDay, description: "Labor Day" });

  // Thanksgiving - Fourth Thursday in November
  const thanksgiving = getNthWeekdayOfMonth(year, 10, 4, 4); // November, Thursday, 4th
  holidays.push({ date: thanksgiving, description: "Thanksgiving Day" });

  // Day after Thanksgiving
  const thanksgivingDate = new Date(thanksgiving);
  thanksgivingDate.setDate(thanksgivingDate.getDate() + 1);
  holidays.push({
    date: thanksgivingDate.toISOString().split('T')[0],
    description: "Day after Thanksgiving"
  });

  return holidays;
}

// Get the Nth occurrence of a weekday in a month
function getNthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  occurrence: number
): string {
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();

  let diff = weekday - firstWeekday;
  if (diff < 0) diff += 7;

  const date = 1 + diff + (occurrence - 1) * 7;
  return new Date(year, month, date).toISOString().split('T')[0];
}

// Get the last occurrence of a weekday in a month
function getLastWeekdayOfMonth(year: number, month: number, weekday: number): string {
  const lastDay = new Date(year, month + 1, 0);
  const lastDate = lastDay.getDate();
  const lastWeekday = lastDay.getDay();

  let diff = lastWeekday - weekday;
  if (diff < 0) diff += 7;

  const date = lastDate - diff;
  return new Date(year, month, date).toISOString().split('T')[0];
}

// Get all holidays for a date range
export function getHolidaysForDateRange(startDate: Date, endDate: Date): { date: string; description: string }[] {
  const holidays: { date: string; description: string }[] = [];
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  for (let year = startYear; year <= endYear; year++) {
    const yearHolidays = getUSFederalHolidays(year);

    for (const holiday of yearHolidays) {
      const holidayDate = new Date(holiday.date);
      if (holidayDate >= startDate && holidayDate <= endDate) {
        holidays.push(holiday);
      }
    }
  }

  return holidays;
}
