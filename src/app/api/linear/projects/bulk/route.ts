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

    const client = getLinearClient();

    // Fetch all projects
    const projects = await Promise.all(
      projectIds.map(async (id) => {
        try {
          const project = await client.project(id);
          const lead = await project.lead;
          const projectStatus = await project.projectStatus;

          console.log(`Fetched project ${project.name}: status=${projectStatus?.name || project.state}, statusId=${projectStatus?.id}`);

          return {
            id: project.id,
            name: project.name,
            description: project.description,
            state: projectStatus?.name || project.state,
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

    return NextResponse.json(projectMap);
  } catch (error) {
    console.error('Error fetching Linear projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Linear projects' },
      { status: 500 }
    );
  }
}
