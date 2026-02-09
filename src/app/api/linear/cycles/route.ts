import { NextRequest, NextResponse } from 'next/server';
import { fetchLinearCycles } from '@/lib/linear';

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

    console.log(`Fetching cycles for team: ${teamId}`);
    const cycles = await fetchLinearCycles(teamId);
    console.log(`Found ${cycles.length} cycles`);

    return NextResponse.json(cycles);
  } catch (error) {
    console.error('Error fetching Linear cycles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Linear cycles', details: error },
      { status: 500 }
    );
  }
}
