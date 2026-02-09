import { NextRequest, NextResponse } from 'next/server';
import { getLinearClient } from '@/lib/linear';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, fieldType, newValue, oldValue, reason } = body;

    if (!projectId || !fieldType || newValue === undefined || !reason) {
      return NextResponse.json(
        { error: 'projectId, fieldType, newValue, and reason are required' },
        { status: 400 }
      );
    }

    const client = getLinearClient();

    // Update the project field
    const updateData: any = {};
    let fieldLabel = '';
    let oldValueDisplay = '';
    let newValueDisplay = '';

    if (fieldType === 'priority') {
      updateData.priority = newValue;
      fieldLabel = 'Priority';
      oldValueDisplay = oldValue ? `P${oldValue}` : 'None';
      newValueDisplay = newValue ? `P${newValue}` : 'None';
    } else if (fieldType === 'status') {
      // For projects, state is a simple string field, not a state ID
      updateData.state = newValue;
      fieldLabel = 'Status';
      oldValueDisplay = oldValue || 'Not set';
      newValueDisplay = newValue;
    }

    await client.updateProject(projectId, updateData);

    // Create a project update comment
    const icon = fieldType === 'priority' ? '🎯' : '📊';
    const updateMessage = `${icon} **${fieldLabel} Updated via Capacity Planner**

${fieldLabel}: ${oldValueDisplay} → ${newValueDisplay}

**Reason:** ${reason}`;

    await client.createProjectUpdate({
      projectId,
      body: updateMessage,
    });

    return NextResponse.json({
      success: true,
      message: `${fieldLabel} updated successfully`,
    });
  } catch (error: any) {
    console.error('Error updating project field:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update field in Linear' },
      { status: 500 }
    );
  }
}
