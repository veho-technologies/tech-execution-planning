import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { Team } from '@/types';
import { fetchLinearProjects } from '@/lib/linear';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { quarter_id } = body;

    if (!quarter_id) {
      return NextResponse.json(
        { error: 'quarter_id is required' },
        { status: 400 }
      );
    }

    // Get team
    const team = await db
      .selectFrom('teams')
      .selectAll()
      .where('id', '=', params.id)
      .executeTakeFirst() as Team | undefined;

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    if (!team.linear_team_id) {
      return NextResponse.json(
        { error: 'Team is not linked to Linear' },
        { status: 400 }
      );
    }

    // Fetch Linear projects (not individual issues)
    console.log(`Fetching Linear projects from team: ${team.linear_team_id}`);
    const projects = await fetchLinearProjects(team.linear_team_id);

    console.log(`Found ${projects.length} projects in Linear`);

    // Import all projects
    let imported = 0;
    let skipped = 0;

    for (const project of projects) {
      // Check if already imported
      const existing = await db
        .selectFrom('projects')
        .select('id')
        .where('linearIssueId', '=', project.id)
        .executeTakeFirst();

      if (existing) {
        skipped++;
        continue;
      }

      // Create project entry (only local fields, everything else from Linear)
      try {
        await db
          .insertInto('projects')
          .values({
            id: `proj-${project.id}`,
            linearIssueId: project.id,
            teamId: team.id,
            quarterId: quarter_id,
            plannedWeeks: 0,
            internalTimeline: null,
            hasFrm: false,
            notes: null,
            dependencies: null,
          })
          .execute();
        imported++;
      } catch (error) {
        console.error(`Error importing project ${project.name}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      total: projects.length,
      imported,
      skipped,
      message: `Imported ${imported} projects from Linear (${skipped} already existed)`,
    });
  } catch (error) {
    console.error('Error syncing from Linear:', error);
    return NextResponse.json(
      { error: 'Failed to sync from Linear' },
      { status: 500 }
    );
  }
}
