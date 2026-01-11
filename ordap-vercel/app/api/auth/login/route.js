import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Password is stored in environment variable for security
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'poom2024';

// Simple token - in production use a proper JWT
function generateToken() {
  return Buffer.from(`poom_auth_${Date.now()}_${Math.random().toString(36)}`).toString('base64');
}

export async function POST(request) {
  try {
    const { password } = await request.json();

    if (password === ADMIN_PASSWORD) {
      const token = generateToken();

      // Set auth cookie (7 days expiry)
      const cookieStore = await cookies();
      cookieStore.set('poom_auth', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/'
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
