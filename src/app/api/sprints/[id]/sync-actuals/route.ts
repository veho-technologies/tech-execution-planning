import { NextRequest, NextResponse } from 'next/server';
import {
  calculateActualDaysForSprint,
  updateSprintAllocationsActualDays,
} from '@/lib/actual-days-calculator';
import db from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sprintId = params.id;

    // Get sprint details
    const sprint = await db
      .selectFrom('sprints')
      .innerJoin('quarters', 'quarters.id', 'sprints.quarterId')
      .select([
        'sprints.id',
        'sprints.name',
        'sprints.quarterId',
        'quarters.teamId',
        'quarters.meetingTimePercentage',
      ])
      .where('sprints.id', '=', sprintId)
      .executeTakeFirst();

    if (!sprint) {
      return NextResponse.json(
        { error: 'Sprint not found' },
        { status: 404 }
      );
    }

    // Calculate focus factor from meeting time
    const focusFactor = 1 - (sprint.meetingTimePercentage || 0.25);

    console.log(`Syncing actual days for sprint ${sprint.name}...`);
    console.log(`Focus factor: ${focusFactor}`);

    // Calculate actual days from Linear state history
    const issueTimeEntries = await calculateActualDaysForSprint(
      sprintId,
      sprint.teamId,
      focusFactor
    );

    console.log(`Calculated time for ${issueTimeEntries.size} engineers`);

    // Update sprint_allocations table
    await updateSprintAllocationsActualDays(sprintId, issueTimeEntries);

    // Get updated allocations to return
    const updatedAllocations = await db
      .selectFrom('sprintAllocations')
      .innerJoin('projects', 'projects.id', 'sprintAllocations.projectId')
      .select([
        'projects.id',
        'projects.title',
        'sprintAllocations.actualDays',
      ])
      .where('sprintAllocations.sprintId', '=', sprintId)
      .where('sprintAllocations.actualDays', '>', 0)
      .execute();

    return NextResponse.json({
      success: true,
      message: `Synced actual days for ${updatedAllocations.length} projects`,
      allocations: updatedAllocations,
    });
  } catch (error: any) {
    console.error('Error syncing actual days:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync actual days' },
      { status: 500 }
    );
  }
}
