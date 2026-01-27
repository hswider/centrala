import { NextResponse } from 'next/server';
import { createUser, initDatabase } from '../../../lib/db';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    await initDatabase();

    // Get Karolina's permissions and role
    const { rows: karolinaRows } = await sql`
      SELECT role, permissions FROM users WHERE username = 'Karolina'
    `;

    const karolinaRole = karolinaRows[0]?.role || 'user';
    const karolinaPermissions = karolinaRows[0]?.permissions || ['dashboard', 'oms', 'wms', 'mes', 'mts', 'crm', 'crm-eu', 'rank', 'agent'];

    // Create Ola user with same permissions as Karolina
    const user = await createUser('Ola', 'OlaPOOM1234!@', karolinaRole, karolinaPermissions);

    return NextResponse.json({
      success: true,
      message: 'User Ola created successfully',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions
      },
      copiedFrom: {
        username: 'Karolina',
        role: karolinaRole,
        permissions: karolinaPermissions
      }
    });
  } catch (error) {
    console.error('Create Ola user error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
