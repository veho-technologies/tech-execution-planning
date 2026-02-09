import { NextRequest, NextResponse } from 'next/server';
import { fetchLinearProjects } from '@/lib/linear';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get('team_id');

    if (!teamId) {
      return NextResponse.json(
        { error: 'team_id is required' },
        { status: 400 }
      );
    }

    // Fetch Linear projects (not individual issues)
    const projects = await fetchLinearProjects(teamId);
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching Linear projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Linear projects' },
      { status: 500 }
    );
  }
}
