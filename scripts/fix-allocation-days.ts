import db from '../src/lib/db';
import { parseISO } from 'date-fns';

/**
 * Calculate working days between two dates, excluding weekends and holidays
 */
function calculateWorkingDays(
  startDate: Date,
  endDate: Date,
  holidays: Date[] = []
): number {
  let workingDays = 0;
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidays.some(
      (holiday) =>
        holiday.getDate() === currentDate.getDate() &&
        holiday.getMonth() === currentDate.getMonth() &&
        holiday.getFullYear() === currentDate.getFullYear()
    );

    if (!isWeekend && !isHoliday) {
      workingDays++;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return workingDays;
}

async function fixAllocationDays() {
  console.log('🔧 Starting allocation days fix...\n');

  // Fetch all allocations
  const allocations = await db
    .selectFrom('sprintAllocations')
    .selectAll()
    .execute();

  console.log(`Found ${allocations.length} allocations\n`);

  let fixed = 0;
  let skipped = 0;

  for (const allocation of allocations) {
    try {
      // Skip if no engineers assigned
      if (!allocation.numEngineers || allocation.numEngineers === 0) {
        console.log(`⏭️  Skipping allocation ${allocation.id} (no engineers)`);
        skipped++;
        continue;
      }

      // Fetch sprint details
      const sprint = await db
        .selectFrom('sprints')
        .selectAll()
        .where('id', '=', allocation.sprintId)
        .executeTakeFirst();

      if (!sprint) {
        console.log(`⚠️  Sprint not found for allocation ${allocation.id}`);
        skipped++;
        continue;
      }

      // Fetch quarter details
      const quarter = await db
        .selectFrom('quarters')
        .selectAll()
        .where('id', '=', sprint.quarterId)
        .executeTakeFirst();

      if (!quarter) {
        console.log(`⚠️  Quarter not found for sprint ${sprint.id}`);
        skipped++;
        continue;
      }

      // Fetch team to get PTO (team-specific setting)
      const team = await db
        .selectFrom('teams')
        .selectAll()
        .where('id', '=', quarter.teamId)
        .executeTakeFirst();

      const ptoDaysPerEngineer = team?.ptoDaysPerEngineer || 0;

      // Fetch holidays for this sprint
      const holidays = await db
        .selectFrom('holidays')
        .selectAll()
        .where('quarterId', '=', quarter.id)
        .execute();

      const startDate = parseISO(sprint.startDate);
      const endDate = parseISO(sprint.endDate);

      const holidayDates = holidays
        .filter((h) => {
          const hDate = parseISO(h.holidayDate);
          return hDate >= startDate && hDate <= endDate;
        })
        .map((h) => parseISO(h.holidayDate));

      // Calculate working days
      const workingDays = calculateWorkingDays(startDate, endDate, holidayDates);

      // Calculate dev focus factor
      const devFocusFactor = 1 - quarter.meetingTimePercentage;

      // Calculate PTO impact for this sprint (prorate across quarter)
      const quarterStart = parseISO(quarter.startDate);
      const quarterEnd = parseISO(quarter.endDate);
      const quarterWorkingDays = calculateWorkingDays(quarterStart, quarterEnd, []);
      const ptoDaysThisSprint = quarterWorkingDays > 0
        ? (ptoDaysPerEngineer / quarterWorkingDays) * workingDays
        : 0;

      // Adjust working days for PTO
      const adjustedWorkingDays = Math.max(0, workingDays - ptoDaysThisSprint);

      // Calculate correct planned days: engineers × (working_days - pto) × dev_focus_factor
      const correctPlannedDays = allocation.numEngineers * adjustedWorkingDays * devFocusFactor;

      // Check if needs updating
      const currentDays = allocation.plannedDays;
      const difference = Math.abs(correctPlannedDays - currentDays);

      if (difference > 0.1) {
        // Update the allocation
        await db
          .updateTable('sprintAllocations')
          .set({
            plannedDays: correctPlannedDays,
            isManualOverride: false,
          })
          .where('id', '=', allocation.id)
          .execute();

        console.log(
          `✅ Fixed allocation ${allocation.id}: ` +
            `${allocation.numEngineers} eng × ${workingDays} days × ${(devFocusFactor * 100).toFixed(0)}% = ` +
            `${currentDays.toFixed(1)}d → ${correctPlannedDays.toFixed(1)}d`
        );
        fixed++;
      } else {
        console.log(`✓  Allocation ${allocation.id} already correct`);
        skipped++;
      }
    } catch (error) {
      console.error(`❌ Error fixing allocation ${allocation.id}:`, error);
      skipped++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Fixed: ${fixed}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${allocations.length}`);
  console.log('\n✨ Done!');
}

// Run the fix
fixAllocationDays()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
