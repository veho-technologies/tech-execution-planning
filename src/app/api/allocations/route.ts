import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'kysely';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('project_id');
    const sprintId = searchParams.get('sprint_id');
    const view = searchParams.get('view') || 'sprint';

    // Build filter conditions
    const projectIds = projectId
      ? projectId.split(',').map(id => id.trim()).filter(Boolean)
      : [];

    if (view === 'weekly') {
      // Return raw rows as-is (including weekStartDate)
      let query = db.selectFrom('sprintAllocations').selectAll();

      if (projectIds.length > 1) {
        query = query.where('projectId', 'in', projectIds);
      } else if (projectIds.length === 1) {
        query = query.where('projectId', '=', projectIds[0]);
      }

      if (sprintId) {
        query = query.where('sprintId', '=', sprintId);
      }

      const allocations = await query.execute();
      return NextResponse.json(allocations);
    }

    // Sprint view: aggregate weekly rows by (project_id, sprint_id)
    // Legacy rows (week_start_date IS NULL) pass through as-is
    const rawQuery = sql`
      SELECT project_id, sprint_id,
        SUM(planned_days) as planned_days,
        SUM(actual_days) as actual_days,
        MAX(num_engineers) as num_engineers,
        STRING_AGG(DISTINCT phase, ',') as phase,
        MAX(engineers_assigned) as engineers_assigned,
        MAX(sprint_goal) as sprint_goal,
        MAX(planned_description) as planned_description,
        MAX(is_manual_override::int)::boolean as is_manual_override
      FROM sprint_allocations
      WHERE 1=1
        ${projectIds.length > 1 ? sql`AND project_id IN (${sql.join(projectIds.map(id => sql`${id}`))})` : projectIds.length === 1 ? sql`AND project_id = ${projectIds[0]}` : sql``}
        ${sprintId ? sql`AND sprint_id = ${sprintId}` : sql``}
      GROUP BY project_id, sprint_id
    `;

    const result = await rawQuery.execute(db);
    // Map snake_case columns to camelCase for API consistency
    const allocations = (result.rows as Record<string, unknown>[]).map(row => ({
      projectId: row.project_id,
      sprintId: row.sprint_id,
      plannedDays: row.planned_days,
      actualDays: row.actual_days,
      numEngineers: row.num_engineers,
      phase: row.phase,
      engineersAssigned: row.engineers_assigned,
      sprintGoal: row.sprint_goal,
      plannedDescription: row.planned_description,
      isManualOverride: row.is_manual_override,
    }));

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
      week_start_date,
    } = body;

    const plannedDaysVal = planned_days ?? 0;
    const actualDaysVal = actual_days ?? 0;
    const plannedDescVal = planned_description ?? null;
    const engAssignedVal = engineers_assigned ?? null;
    const sprintGoalVal = sprint_goal ?? null;
    const weekStartVal = week_start_date ?? null;

    // Use raw SQL for upsert to handle COALESCE-based unique index
    await sql`
      INSERT INTO sprint_allocations (
        project_id, sprint_id, planned_days, actual_days,
        planned_description, engineers_assigned, phase, sprint_goal,
        num_engineers, is_manual_override, week_start_date
      ) VALUES (
        ${project_id}, ${sprint_id}, ${plannedDaysVal}, ${actualDaysVal},
        ${plannedDescVal}, ${engAssignedVal}, ${phase}, ${sprintGoalVal},
        ${num_engineers}, ${is_manual_override}, ${weekStartVal}
      )
      ON CONFLICT (project_id, sprint_id, COALESCE(week_start_date, '1970-01-01'))
      DO UPDATE SET
        planned_days = ${plannedDaysVal},
        actual_days = ${actualDaysVal},
        planned_description = ${plannedDescVal},
        engineers_assigned = ${engAssignedVal},
        phase = ${phase},
        sprint_goal = ${sprintGoalVal},
        num_engineers = ${num_engineers},
        is_manual_override = ${is_manual_override}
    `.execute(db);

    // Fetch the upserted row
    let fetchQuery = db
      .selectFrom('sprintAllocations')
      .selectAll()
      .where('projectId', '=', project_id)
      .where('sprintId', '=', sprint_id);

    if (week_start_date) {
      fetchQuery = fetchQuery.where('weekStartDate', '=', week_start_date);
    } else {
      fetchQuery = fetchQuery.where('weekStartDate', 'is', null);
    }

    const allocation = await fetchQuery.executeTakeFirstOrThrow();

    return NextResponse.json(allocation, { status: 201 });
  } catch (error) {
    console.error('Error creating allocation:', error);
    return NextResponse.json(
      { error: 'Failed to create allocation' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const projectId = searchParams.get('project_id');
    const sprintId = searchParams.get('sprint_id');
    const legacyOnly = searchParams.get('legacy_only'); // delete only sprint-level (no week) allocations

    if (id) {
      await db.deleteFrom('sprintAllocations').where('id', '=', parseInt(id)).execute();
    } else if (projectId && sprintId) {
      let query = db.deleteFrom('sprintAllocations')
        .where('projectId', '=', projectId)
        .where('sprintId', '=', sprintId);
      if (legacyOnly === 'true') {
        query = query.where('weekStartDate', 'is', null);
      }
      await query.execute();
    } else if (projectId) {
      let query = db.deleteFrom('sprintAllocations').where('projectId', '=', projectId);
      if (legacyOnly === 'true') {
        query = query.where('weekStartDate', 'is', null);
      }
      await query.execute();
    } else {
      return NextResponse.json({ error: 'id, project_id, or project_id+sprint_id required' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting allocation:', error);
    return NextResponse.json({ error: 'Failed to delete allocation' }, { status: 500 });
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
