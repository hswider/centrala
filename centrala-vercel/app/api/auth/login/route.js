import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyUser, initDatabase } from '../../../../lib/db';

// Simple token generator
function generateToken() {
  return Buffer.from(`poom_auth_${Date.now()}_${Math.random().toString(36)}`).toString('base64');
}

export async function POST(request) {
  try {
    // Ensure database is initialized
    await initDatabase();

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Username and password required' }, { status: 400 });
    }

    const user = await verifyUser(username, password);

    if (user) {
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

      // Store user info in cookie
      cookieStore.set('poom_user', JSON.stringify({
        id: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/'
      });

      return NextResponse.json({
        success: true,
        user: {
          username: user.username,
          role: user.role,
          permissions: user.permissions
        }
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
