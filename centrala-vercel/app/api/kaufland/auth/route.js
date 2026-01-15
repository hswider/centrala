import { NextResponse } from 'next/server';
import { initDatabase } from '../../../../lib/db';
import { isAuthenticated } from '../../../../lib/kaufland';

// GET - Check Kaufland API authentication status
export async function GET() {
  try {
    await initDatabase();

    const authenticated = await isAuthenticated();

    return NextResponse.json({
      success: true,
      authenticated: authenticated
    });
  } catch (error) {
    console.error('Kaufland auth check error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
