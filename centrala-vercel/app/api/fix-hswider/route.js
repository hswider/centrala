import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    // Get Karolina's permissions and role
    const { rows: karolinaRows } = await sql`
      SELECT role, permissions FROM users WHERE username = 'Karolina'
    `;

    const karolinaRole = karolinaRows[0]?.role || 'user';
    const karolinaPermissions = karolinaRows[0]?.permissions || ['dashboard', 'oms', 'wms', 'mes', 'mts', 'crm', 'crm-eu', 'rank', 'agent'];
    const permissionsJson = JSON.stringify(karolinaPermissions);

    // Update Fabienne with same role and permissions as Karolina
    const { rows: updatedUser } = await sql`
      UPDATE users
      SET role = ${karolinaRole},
          permissions = ${permissionsJson}::jsonb
      WHERE username = 'Fabienne'
      RETURNING id, username, role, permissions
    `;

    return NextResponse.json({
      success: true,
      message: 'User Fabienne updated with same role and permissions as Karolina',
      user: updatedUser[0],
      copiedFrom: {
        username: 'Karolina',
        role: karolinaRole,
        permissions: karolinaPermissions
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
