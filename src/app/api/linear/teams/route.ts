import { NextResponse } from 'next/server';
import { fetchLinearTeams } from '@/lib/linear';

export async function GET() {
  try {
    const teams = await fetchLinearTeams();
    return NextResponse.json(teams);
  } catch (error) {
    console.error('Error fetching Linear teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Linear teams. Check your API key.' },
      { status: 500 }
    );
  }
}
