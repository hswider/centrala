import { NextResponse } from 'next/server';
import { createUser, initDatabase } from '../../../../lib/db';

// POST - create user with secret key (for initial setup)
export async function POST(request) {
  try {
    const { secret, username, password, role, permissions } = await request.json();

    // Check secret key (use CRON_SECRET or a specific USER_INIT_SECRET)
    const validSecret = process.env.CRON_SECRET || process.env.USER_INIT_SECRET;
    if (!secret || secret !== validSecret) {
      return NextResponse.json({ success: false, error: 'Invalid secret' }, { status: 401 });
    }

    await initDatabase();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Username i haslo sa wymagane' }, { status: 400 });
    }

    const user = await createUser(username, password, role || 'user', permissions);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('User init error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
