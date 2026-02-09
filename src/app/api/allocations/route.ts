import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('project_id');
    const sprintId = searchParams.get('sprint_id');

    let query = db.selectFrom('sprintAllocations').selectAll();

    if (projectId) {
      // Handle comma-separated project IDs
      const projectIds = projectId.split(',').map(id => id.trim()).filter(Boolean);
      if (projectIds.length > 1) {
        query = query.where('projectId', 'in', projectIds);
      } else if (projectIds.length === 1) {
        query = query.where('projectId', '=', projectIds[0]);
      }
    }

    if (sprintId) {
      query = query.where('sprintId', '=', sprintId);
    }

    const allocations = await query.execute();

    return NextResponse.json(allocations);
  } catch (error) {
    console.error('Error fetching allocations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch allocations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      project_id,
      sprint_id,
      planned_days,
      actual_days,
      planned_description,
      engineers_assigned,
      phase = 'Execution',
      sprint_goal,
      num_engineers = 0,
      is_manual_override = false,
    } = body;

    await db
      .insertInto('sprintAllocations')
      .values({
        projectId: project_id,
        sprintId: sprint_id,
        plannedDays: planned_days ?? 0,
        actualDays: actual_days ?? 0,
        plannedDescription: planned_description ?? null,
        engineersAssigned: engineers_assigned ?? null,
        phase,
        sprintGoal: sprint_goal ?? null,
        numEngineers: num_engineers,
        isManualOverride: is_manual_override,
      })
      .onConflict((oc) => oc
        .columns(['projectId', 'sprintId'])
        .doUpdateSet({
          plannedDays: planned_days ?? 0,
          actualDays: actual_days ?? 0,
          plannedDescription: planned_description ?? null,
          engineersAssigned: engineers_assigned ?? null,
          phase,
          sprintGoal: sprint_goal ?? null,
          numEngineers: num_engineers,
          isManualOverride: is_manual_override,
        })
      )
      .execute();

    const allocation = await db
      .selectFrom('sprintAllocations')
      .selectAll()
      .where('projectId', '=', project_id)
      .where('sprintId', '=', sprint_id)
      .executeTakeFirstOrThrow();

    return NextResponse.json(allocation, { status: 201 });
  } catch (error) {
    console.error('Error creating allocation:', error);
    return NextResponse.json(
      { error: 'Failed to create allocation' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      project_id,
      sprint_id,
      planned_days,
      actual_days,
      planned_description,
      engineers_assigned,
      phase,
      sprint_goal,
      num_engineers,
      is_manual_override,
    } = body;

    await db
      .updateTable('sprintAllocations')
      .set({
        plannedDays: planned_days ?? 0,
        actualDays: actual_days ?? 0,
        plannedDescription: planned_description ?? null,
        engineersAssigned: engineers_assigned ?? null,
        phase: phase ?? 'Execution',
        sprintGoal: sprint_goal ?? null,
        numEngineers: num_engineers ?? 0,
        isManualOverride: is_manual_override ?? false,
      })
      .where('projectId', '=', project_id)
      .where('sprintId', '=', sprint_id)
      .execute();

    const allocation = await db
      .selectFrom('sprintAllocations')
      .selectAll()
      .where('projectId', '=', project_id)
      .where('sprintId', '=', sprint_id)
      .executeTakeFirstOrThrow();

    return NextResponse.json(allocation);
  } catch (error) {
    console.error('Error updating allocation:', error);
    return NextResponse.json(
      { error: 'Failed to update allocation' },
      { status: 500 }
    );
  }
}
