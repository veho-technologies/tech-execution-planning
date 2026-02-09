import { NextRequest, NextResponse } from 'next/server';
import { fetchLinearIssuesByIds } from '@/lib/linear';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { issueIds } = body;

    if (!issueIds || !Array.isArray(issueIds)) {
      return NextResponse.json(
        { error: 'issueIds array is required' },
        { status: 400 }
      );
    }

    const issues = await fetchLinearIssuesByIds(issueIds);

    // Return as a map for easy lookup
    const issueMap = issues.reduce((acc, issue) => {
      acc[issue.id] = issue;
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json(issueMap);
  } catch (error) {
    console.error('Error fetching Linear issues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Linear issues' },
      { status: 500 }
    );
  }
}
