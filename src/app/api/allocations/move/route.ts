import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, from_sprint_id, to_sprint_id } = body;

    if (!project_id || !from_sprint_id || !to_sprint_id) {
      return NextResponse.json(
        { error: 'project_id, from_sprint_id, and to_sprint_id are required' },
        { status: 400 }
      );
    }

    console.log('Moving allocation:', { project_id, from_sprint_id, to_sprint_id });

    // Check if allocation exists for source sprint
    const sourceAllocation = await db
      .selectFrom('sprintAllocations')
      .selectAll()
      .where('projectId', '=', project_id)
      .where('sprintId', '=', from_sprint_id)
      .executeTakeFirst();

    if (!sourceAllocation) {
      return NextResponse.json(
        { error: 'No allocation found in source sprint' },
        { status: 404 }
      );
    }

    // Check if allocation already exists for target sprint
    const targetAllocation = await db
      .selectFrom('sprintAllocations')
      .selectAll()
      .where('projectId', '=', project_id)
      .where('sprintId', '=', to_sprint_id)
      .executeTakeFirst();

    if (targetAllocation) {
      // If target already has an allocation, merge them
      await db
        .updateTable('sprintAllocations')
        .set({
          plannedDays: targetAllocation.plannedDays + sourceAllocation.plannedDays,
          numEngineers: targetAllocation.numEngineers + sourceAllocation.numEngineers,
        })
        .where('projectId', '=', project_id)
        .where('sprintId', '=', to_sprint_id)
        .execute();

      // Delete the source allocation
      await db
        .deleteFrom('sprintAllocations')
        .where('projectId', '=', project_id)
        .where('sprintId', '=', from_sprint_id)
        .execute();

      console.log('Merged allocations:', {
        newPlannedDays: targetAllocation.plannedDays + sourceAllocation.plannedDays,
      });
    } else {
      // No target allocation exists, just update the sprint_id
      await db
        .updateTable('sprintAllocations')
        .set({ sprintId: to_sprint_id })
        .where('projectId', '=', project_id)
        .where('sprintId', '=', from_sprint_id)
        .execute();

      console.log('Moved allocation to new sprint');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error moving allocation:', error);
    return NextResponse.json(
      { error: 'Failed to move allocation' },
      { status: 500 }
    );
  }
}
