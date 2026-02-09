import { NextResponse } from 'next/server';
import { initializeQuarters } from '@/lib/quarters';

export async function POST() {
  try {
    await initializeQuarters();
    return NextResponse.json({
      success: true,
      message: 'Quarters and holidays initialized successfully'
    });
  } catch (error) {
    console.error('Error initializing quarters:', error);
    return NextResponse.json(
      { error: 'Failed to initialize quarters' },
      { status: 500 }
    );
  }
}
