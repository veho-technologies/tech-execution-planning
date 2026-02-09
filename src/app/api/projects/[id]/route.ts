import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await db
      .selectFrom('projects')
      .selectAll()
      .where('id', '=', params.id)
      .executeTakeFirst();

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      title,
      priority,
      engineering_poc,
      engineering_lead,
      status,
      health,
      external_timeline,
      internal_timeline,
      original_effort,
      has_frm,
      notes,
      dependencies,
    } = body;

    await db
      .updateTable('projects')
      .set({
        internalTimeline: internal_timeline ?? null,
        hasFrm: has_frm ?? false,
        notes: notes ?? null,
        dependencies: dependencies ?? null,
      })
      .where('id', '=', params.id)
      .execute();

    const project = await db
      .selectFrom('projects')
      .selectAll()
      .where('id', '=', params.id)
      .executeTakeFirst();

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Delete associated allocations first (foreign key constraint)
    await db
      .deleteFrom('sprint_allocations')
      .where('projectId', '=', params.id)
      .execute();

    // Then delete the project
    await db
      .deleteFrom('projects')
      .where('id', '=', params.id)
      .execute();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
