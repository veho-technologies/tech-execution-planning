import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.deleteFrom('ptoEntries').where('id', '=', Number(params.id)).execute();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting PTO entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete PTO entry' },
      { status: 500 }
    );
  }
}
