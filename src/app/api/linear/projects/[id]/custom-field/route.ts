import { NextRequest, NextResponse } from 'next/server';
import { updateLinearProjectCustomField } from '@/lib/linear';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { fieldName, value } = body;

    if (!fieldName || value === undefined) {
      return NextResponse.json(
        { error: 'fieldName and value are required' },
        { status: 400 }
      );
    }

    await updateLinearProjectCustomField(params.id, fieldName, value);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating Linear custom field:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update Linear custom field' },
      { status: 500 }
    );
  }
}
