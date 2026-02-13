// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { parseISO } from 'date-fns';

export const dynamic = 'force-dynamic';

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

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting allocation days fix...\n');

    // Fetch all allocations
    const allocations = await db
      .selectFrom('sprintAllocations')
      .selectAll()
      .execute();

    console.log(`Found ${allocations.length} allocations\n`);

    const results = {
      fixed: [] as any[],
      skipped: [] as any[],
      errors: [] as any[],
      debug: null as any,
    };

    for (const allocation of allocations) {
      try {
        // Capture debug for first non-zero allocation
        const isDebugAllocation = !results.debug && (allocation.numEngineers ?? 0) > 0;

        // Skip if no engineers assigned
        if (!allocation.numEngineers || allocation.numEngineers === 0) {
          console.log(`⏭️  Skipping allocation ${allocation.id} (no engineers)`);
          results.skipped.push({
            id: allocation.id,
            reason: 'No engineers assigned',
          });
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
          results.skipped.push({
            id: allocation.id,
            reason: 'Sprint not found',
          });
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
          results.skipped.push({
            id: allocation.id,
            reason: 'Quarter not found',
          });
          continue;
        }

        // Fetch project to get team ID
        const project = await db
          .selectFrom('projects')
          .selectAll()
          .where('id', '=', allocation.projectId)
          .executeTakeFirst();

        if (!project) {
          console.log(`⚠️  Project not found for allocation ${allocation.id}`);
          results.skipped.push({
            id: allocation.id,
            reason: 'Project not found',
          });
          continue;
        }

        // Fetch team to get base settings
        const team = await db
          .selectFrom('teams')
          .selectAll()
          .where('id', '=', project.teamId)
          .executeTakeFirst();

        if (!team) {
          console.log(`⚠️  Team not found for project ${project.id}`);
          results.skipped.push({
            id: allocation.id,
            reason: 'Team not found',
          });
          continue;
        }

        // Check for quarterly overrides
        const quarterSettings = await db
          .selectFrom('teamQuarterSettings')
          .selectAll()
          .where('teamId', '=', team.id)
          .where('quarterId', '=', quarter.id)
          .executeTakeFirst();

        // Use quarterly overrides if available, otherwise fall back to team/quarter defaults
        const totalEngineers = quarterSettings?.totalEngineers ?? team.totalEngineers ?? 0;
        const ktloEngineers = quarterSettings?.ktloEngineers ?? team.ktloEngineers ?? 0;
        const ptoDaysPerEngineer = quarterSettings?.ptoDaysPerEngineer ?? team.ptoDaysPerEngineer ?? 0;
        const roadmapEngineers = Math.max(0, totalEngineers - ktloEngineers);

        // Fetch holidays for this sprint
        const holidays = await db
          .selectFrom('holidays')
          .selectAll()
          .where('quarterId', '=', quarter.id)
          .execute();

        // Handle dates - they might already be Date objects from DB
        const startDate = typeof sprint.startDate === 'string' ? parseISO(sprint.startDate) : new Date(sprint.startDate);
        const endDate = typeof sprint.endDate === 'string' ? parseISO(sprint.endDate) : new Date(sprint.endDate);

        const holidayDates = holidays
          .filter((h) => {
            const hDate = typeof h.holidayDate === 'string' ? parseISO(h.holidayDate) : new Date(h.holidayDate);
            return hDate >= startDate && hDate <= endDate;
          })
          .map((h) => typeof h.holidayDate === 'string' ? parseISO(h.holidayDate) : new Date(h.holidayDate));

        // Calculate working days
        const workingDays = calculateWorkingDays(startDate, endDate, holidayDates);

        // Calculate dev focus factor using quarterly override if available
        const meetingTimePercentage = quarterSettings?.meetingTimePercentage ?? quarter.meetingTimePercentage ?? 0;
        const devFocusFactor = 1 - meetingTimePercentage;

        // Debug first allocation only
        if (isDebugAllocation) {
          results.debug = {
            allocationId: allocation.id,
            sprint: sprint.name,
            quarterSettingsFound: !!quarterSettings,
            meetingPercentOverride: quarterSettings?.meetingTimePercentage,
            meetingPercentBase: quarter.meetingTimePercentage,
            meetingPercentUsing: meetingTimePercentage,
            devFocus: devFocusFactor,
            workingDays,
            ptoDaysPerEngineer,
            roadmapEngineers,
            engineers: allocation.numEngineers,
            currentDays: allocation.plannedDays,
          };
        }

        // Calculate PTO impact for this sprint (prorate across quarter)
        const quarterStart = typeof quarter.startDate === 'string' ? parseISO(quarter.startDate) : new Date(quarter.startDate);
        const quarterEnd = typeof quarter.endDate === 'string' ? parseISO(quarter.endDate) : new Date(quarter.endDate);
        const quarterWorkingDays = calculateWorkingDays(quarterStart, quarterEnd, []);
        const ptoDaysThisSprint = quarterWorkingDays > 0
          ? (ptoDaysPerEngineer / quarterWorkingDays) * workingDays
          : 0;

        // Adjust working days for PTO
        const adjustedWorkingDays = Math.max(0, workingDays - ptoDaysThisSprint);

        // Calculate correct planned days: engineers × (working_days - pto) × dev_focus_factor
        const correctPlannedDays = allocation.numEngineers * adjustedWorkingDays * devFocusFactor;

        // Add to debug if this is the debug allocation
        if (isDebugAllocation && results.debug) {
          results.debug.ptoDaysThisSprint = ptoDaysThisSprint;
          results.debug.adjustedWorkingDays = adjustedWorkingDays;
          results.debug.correctPlannedDays = correctPlannedDays;
          results.debug.difference = difference;
        }

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

          const msg = `✅ Fixed allocation ${allocation.id}: ` +
            `${allocation.numEngineers} eng × ${workingDays} days × ${(devFocusFactor * 100).toFixed(0)}% = ` +
            `${currentDays.toFixed(1)}d → ${correctPlannedDays.toFixed(1)}d`;

          console.log(msg);

          results.fixed.push({
            id: allocation.id,
            numEngineers: allocation.numEngineers,
            oldDays: currentDays,
            newDays: correctPlannedDays,
            sprint: sprint.name,
          });
        } else {
          console.log(`✓  Allocation ${allocation.id} already correct`);
          results.skipped.push({
            id: allocation.id,
            reason: 'Already correct',
          });
        }
      } catch (error: any) {
        console.error(`❌ Error fixing allocation ${allocation.id}:`, error);
        results.errors.push({
          id: allocation.id,
          error: error.message,
        });
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Fixed: ${results.fixed.length}`);
    console.log(`   Skipped: ${results.skipped.length}`);
    console.log(`   Errors: ${results.errors.length}`);
    console.log(`   Total: ${allocations.length}`);
    console.log('\n✨ Done!');

    return NextResponse.json({
      success: true,
      summary: {
        total: allocations.length,
        fixed: results.fixed.length,
        skipped: results.skipped.length,
        errors: results.errors.length,
      },
      details: results,
    });
  } catch (error: any) {
    console.error('Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fix allocation days' },
      { status: 500 }
    );
  }
}
