import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('poom_auth');
    const userCookie = cookieStore.get('poom_user');

    if (!authCookie || !userCookie) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const user = JSON.parse(userCookie.value);

    // Update last_activity for online status tracking
    try {
      await sql`UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE id = ${user.id}`;
    } catch (e) {
      // Silently ignore - don't break auth if this fails
    }

    // Default permissions if not set
    const defaultAdminPermissions = ['dashboard', 'oms', 'wms', 'mes', 'mts', 'crm', 'crm-eu', 'rank', 'agent', 'admin'];
    const defaultUserPermissions = ['dashboard', 'oms', 'wms', 'mes', 'mts', 'crm', 'crm-eu', 'rank', 'agent'];

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions || (user.role === 'admin' ? defaultAdminPermissions : defaultUserPermissions)
      }
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
