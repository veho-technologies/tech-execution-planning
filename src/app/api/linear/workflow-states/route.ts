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
    const team = await client.team(teamId);
    const workflowStates = await team.states();

    const states = workflowStates.nodes.map(state => ({
      id: state.id,
      name: state.name,
    }));

    return NextResponse.json(states);
  } catch (error: any) {
    console.error('Error fetching workflow states:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch workflow states' },
      { status: 500 }
    );
  }
}