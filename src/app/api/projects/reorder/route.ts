import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectOrders } = body;

    if (!projectOrders || !Array.isArray(projectOrders)) {
      return NextResponse.json(
        { error: 'projectOrders array is required' },
        { status: 400 }
      );
    }

    // Update display order for each project
    for (const { id, displayOrder } of projectOrders) {
      await db
        .updateTable('projects')
        .set({ displayOrder })
        .where('id', '=', id)
        .execute();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering projects:', error);
    return NextResponse.json(
      { error: 'Failed to reorder projects' },
      { status: 500 }
    );
  }
}
