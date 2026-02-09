import { NextRequest, NextResponse } from 'next/server';
import { getLinearClient } from '@/lib/linear';

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

    const client = getLinearClient();

    // Fetch project statuses for the organization (not team-specific workflow states)
    const projectStatuses = await client.projectStatuses();

    const statuses = projectStatuses.nodes.map(status => ({
      id: status.id,
      name: status.name,
      description: status.description,
      color: status.color,
    }));

    return NextResponse.json(statuses);
  } catch (error: any) {
    console.error('Error fetching project statuses:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch project statuses' },
      { status: 500 }
    );
  }
}