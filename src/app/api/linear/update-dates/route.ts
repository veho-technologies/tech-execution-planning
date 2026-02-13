import { NextRequest, NextResponse } from 'next/server';
import { getLinearClient } from '@/lib/linear';
import { format, parseISO } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, dateType, newDate, oldDate, reason } = body;

    if (!projectId || !dateType || !newDate || !reason) {
      return NextResponse.json(
        { error: 'projectId, dateType, newDate, and reason are required' },
        { status: 400 }
      );
    }

    const client = getLinearClient();

    // Format dates for display
    const formatDate = (date: string | null) => {
      if (!date) return 'Not set';
      try {
        return format(parseISO(date), 'MMM d, yyyy');
      } catch {
        return date;
      }
    };

    // Update the project date
    const updateData: any = {};
    if (dateType === 'start') {
      updateData.startDate = newDate;
    } else if (dateType === 'target') {
      updateData.targetDate = newDate;
    }

    await client.updateProject(projectId, updateData);

    // Create a project update with clear formatting
    const updateMessage = `📅 **Dates Updated via Capacity Planner**

${dateType === 'start' ? 'Start Date' : 'Target Date'}: ${formatDate(oldDate)} → ${formatDate(newDate)}

**Reason:** ${reason}`;

    await client.createProjectUpdate({
      projectId,
      body: updateMessage,
    });

    return NextResponse.json({
      success: true,
      message: 'Date updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating Linear project date:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update date in Linear' },
      { status: 500 }
    );
  }
}
