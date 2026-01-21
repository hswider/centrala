import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    // Get Karolina's permissions
    const { rows: karolinaRows } = await sql`
      SELECT permissions FROM users WHERE username = 'Karolina'
    `;

    const karolinaPermissions = karolinaRows[0]?.permissions || ['dashboard', 'oms', 'wms', 'mes', 'mts', 'crm', 'crm-eu', 'rank', 'agent'];
    const permissionsJson = JSON.stringify(karolinaPermissions);

    // Create new user Fabienne with same permissions as Karolina
    const passwordHash = await bcrypt.hash('Gutekissen1234!@', 10);

    const { rows: newUser } = await sql`
      INSERT INTO users (username, password_hash, role, permissions)
      VALUES ('Fabienne', ${passwordHash}, 'user', ${permissionsJson}::jsonb)
      ON CONFLICT (username) DO UPDATE SET
        password_hash = ${passwordHash},
        permissions = ${permissionsJson}::jsonb
      RETURNING id, username, role, permissions
    `;

    return NextResponse.json({
      success: true,
      message: 'User Fabienne created with same permissions as Karolina',
      user: newUser[0],
      copiedFrom: 'Karolina',
      permissions: karolinaPermissions
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
