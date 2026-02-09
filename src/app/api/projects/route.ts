import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const quarterId = searchParams.get('quarter_id');
    const teamId = searchParams.get('team_id');

    let query = db.selectFrom('projects').selectAll();

    if (quarterId) {
      query = query.where('quarterId', '=', quarterId);
    }

    if (teamId) {
      query = query.where('teamId', '=', teamId);
    }

    const projects = await query
      .orderBy('displayOrder', 'asc')
      .orderBy('createdAt', 'desc')
      .execute();

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      linear_issue_id,
      team_id,
      quarter_id,
      planned_weeks,
      internal_timeline,
      has_frm,
      notes,
      dependencies,
    } = body;

    console.log('Creating project with data:', {
      id,
      linear_issue_id,
      team_id,
      quarter_id,
    });

    // Check if project already exists with this ID
    const existingProject = await db
      .selectFrom('projects')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (existingProject) {
      console.log('Project already exists with ID:', id);
      return NextResponse.json(existingProject, { status: 200 });
    }

    // Only store local planning fields
    await db
      .insertInto('projects')
      .values({
        id,
        linearIssueId: linear_issue_id,
        teamId: team_id,
        quarterId: quarter_id,
        plannedWeeks: planned_weeks ?? 0,
        internalTimeline: internal_timeline ?? null,
        hasFrm: has_frm ?? false,
        notes: notes ?? null,
        dependencies: dependencies ?? null,
      })
      .execute();

    const project = await db
      .selectFrom('projects')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    console.error('Error creating project:', error);
    console.error('Error details:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Failed to create project', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, planned_weeks, internal_timeline, has_frm, notes, dependencies } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updates: any = {};

    if (planned_weeks !== undefined) {
      updates.plannedWeeks = planned_weeks;
    }
    if (internal_timeline !== undefined) {
      updates.internalTimeline = internal_timeline;
    }
    if (has_frm !== undefined) {
      updates.hasFrm = has_frm;
    }
    if (notes !== undefined) {
      updates.notes = notes;
    }
    if (dependencies !== undefined) {
      updates.dependencies = dependencies;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    await db
      .updateTable('projects')
      .set(updates)
      .where('id', '=', id)
      .execute();

    const project = await db
      .selectFrom('projects')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}
