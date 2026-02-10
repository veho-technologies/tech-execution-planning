import { NextRequest, NextResponse } from 'next/server';
import { getLinearClient } from '@/lib/linear';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectIds } = body;

    if (!projectIds || !Array.isArray(projectIds)) {
      return NextResponse.json(
        { error: 'projectIds array is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching fresh data for ${projectIds.length} projects from Linear...`);
    const client = getLinearClient();

    // Fetch all projects
    const projects = await Promise.all(
      projectIds.map(async (id) => {
        try {
          const project = await client.project(id);
          const lead = await project.lead;

          // Try both status and projectStatus
          let projectStatus = null;
          try {
            projectStatus = await project.status;
          } catch (e) {
            // Fallback to projectStatus if status doesn't exist
            projectStatus = await project.projectStatus;
          }

          // Debug what we're getting
          console.log(`\n--- Project: ${project.name} ---`);
          console.log(`  project.state: ${project.state}`);
          console.log(`  status: ${projectStatus ? JSON.stringify({id: projectStatus.id, name: projectStatus.name}) : 'null'}`);

          return {
            id: project.id,
            name: project.name,
            description: project.description,
            state: projectStatus?.name || null, // Only show custom status, blank if none
            stateId: projectStatus?.id || null,
            priority: project.priority,
            targetDate: project.targetDate,
            startDate: project.startDate,
            lead: lead ? {
              id: lead.id,
              name: lead.name,
              email: lead.email,
            } : null,
            url: project.url,
            progress: project.progress,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
          };
        } catch (error) {
          console.error(`Error fetching project ${id}:`, error);
          return null;
        }
      })
    );

    // Filter out null values and return as a map for easy lookup
    const projectMap = projects
      .filter(p => p !== null)
      .reduce((acc, project) => {
        if (project) {
          acc[project.id] = project;
        }
        return acc;
      }, {} as Record<string, any>);

    const response = NextResponse.json(projectMap);

    // Disable caching to ensure fresh data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Error fetching Linear projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Linear projects' },
      { status: 500 }
    );
  }
}
