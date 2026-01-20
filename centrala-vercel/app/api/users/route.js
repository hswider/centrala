import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createUser, getUsers, initDatabase } from '../../../lib/db';
import { sql } from '@vercel/postgres';

// Helper to check if user is admin
async function isAdmin() {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('poom_user');
    if (userCookie) {
      const user = JSON.parse(userCookie.value);
      return user.role === 'admin';
    }
  } catch (e) {
    console.error('Error checking admin:', e);
  }
  return false;
}

// GET - list all users (admin only)
export async function GET() {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ success: false, error: 'Brak uprawnien' }, { status: 403 });
    }

    await initDatabase();
    const users = await getUsers();

    // Get permissions for each user
    const { rows: usersWithPermissions } = await sql`
      SELECT id, username, role, permissions, created_at, last_login
      FROM users
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ success: true, users: usersWithPermissions });
  } catch (error) {
    console.error('Users GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - create new user (admin only)
export async function POST(request) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ success: false, error: 'Brak uprawnien' }, { status: 403 });
    }

    await initDatabase();
    const { username, password, role, permissions } = await request.json();

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
    console.error('Users POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT - update user permissions (admin only)
export async function PUT(request) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ success: false, error: 'Brak uprawnien' }, { status: 403 });
    }

    await initDatabase();
    const { id, permissions, role } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID uzytkownika jest wymagane' }, { status: 400 });
    }

    const permissionsJson = JSON.stringify(permissions);
    const { rows } = await sql`
      UPDATE users
      SET permissions = ${permissionsJson}::jsonb,
          role = COALESCE(${role}, role)
      WHERE id = ${id}
      RETURNING id, username, role, permissions
    `;

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Uzytkownik nie znaleziony' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: rows[0] });
  } catch (error) {
    console.error('Users PUT error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - delete user (admin only)
export async function DELETE(request) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ success: false, error: 'Brak uprawnien' }, { status: 403 });
    }

    await initDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID uzytkownika jest wymagane' }, { status: 400 });
    }

    await sql`DELETE FROM users WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Users DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
