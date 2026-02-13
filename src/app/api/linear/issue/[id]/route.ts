import { NextRequest, NextResponse } from 'next/server';
import { getLinearClient } from '@/lib/linear';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = getLinearClient();
    const issue = await client.issue(params.id);

    const [state, assignee, priority] = await Promise.all([
      issue.state,
      issue.assignee,
      Promise.resolve(issue.priority),
    ]);

    return NextResponse.json({
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      description: issue.description,
      priority: priority,
      priorityLabel: issue.priorityLabel,
      estimate: issue.estimate,
      state: state ? {
        id: state.id,
        name: state.name,
        type: state.type,
      } : null,
      assignee: assignee ? {
        id: assignee.id,
        name: assignee.name,
        email: assignee.email,
      } : null,
      url: issue.url,
      updatedAt: issue.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching Linear issue:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Linear issue' },
      { status: 500 }
    );
  }
}
