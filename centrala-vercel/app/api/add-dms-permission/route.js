import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminOnly = searchParams.get('adminOnly') === 'true';
    const usersParam = searchParams.get('users'); // comma-separated usernames

    let users;

    if (usersParam) {
      // Get specific users by username
      const usernames = usersParam.split(',').map(u => u.trim());
      const { rows } = await sql`
        SELECT id, username, role, permissions FROM users
        WHERE username = ANY(${usernames})
      `;
      users = rows;
    } else if (adminOnly) {
      // Get only admin users
      const { rows } = await sql`SELECT id, username, role, permissions FROM users WHERE role = 'admin'`;
      users = rows;
    } else {
      // Get all users
      const { rows } = await sql`SELECT id, username, role, permissions FROM users`;
      users = rows;
    }

    const updated = [];

    for (const user of users) {
      const currentPermissions = user.permissions || [];

      // Add 'dms' if not already present
      if (!currentPermissions.includes('dms')) {
        const newPermissions = [...currentPermissions, 'dms'];
        const permissionsJson = JSON.stringify(newPermissions);

        await sql`
          UPDATE users
          SET permissions = ${permissionsJson}::jsonb
          WHERE id = ${user.id}
        `;

        updated.push({
          username: user.username,
          role: user.role,
          oldPermissions: currentPermissions,
          newPermissions: newPermissions
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Added DMS permission to ${updated.length} users`,
      updated: updated,
      totalUsers: users.length
    });
  } catch (error) {
    console.error('Add DMS permission error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
