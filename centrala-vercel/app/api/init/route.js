import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { initDatabase } from '@/lib/db';

// Endpoint to initialize database and set initial tokens
export async function POST(request) {
  try {
    const body = await request.json();
    const { accessToken, refreshToken, expiresAt } = body;

    await initDatabase();

    if (accessToken && refreshToken) {
      await sql`
        UPDATE tokens
        SET access_token = ${accessToken},
            refresh_token = ${refreshToken},
            expires_at = ${expiresAt || Date.now() + 3600000},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `;

      return NextResponse.json({
        success: true,
        message: 'Tokens saved successfully'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Database initialized'
    });
  } catch (error) {
    console.error('[Init] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await initDatabase();
    return NextResponse.json({
      success: true,
      message: 'Database initialized'
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
