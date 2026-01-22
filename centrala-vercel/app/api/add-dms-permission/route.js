import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    // Get all users
    const { rows: users } = await sql`
      SELECT id, username, permissions FROM users
    `;

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
