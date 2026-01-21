import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    // Full permissions for all modules
    const adminPermissions = JSON.stringify(['dashboard', 'oms', 'wms', 'mes', 'mts', 'crm', 'crm-eu', 'rank', 'agent', 'admin']);
    const userPermissions = JSON.stringify(['dashboard', 'oms', 'wms', 'mes', 'mts', 'crm', 'crm-eu', 'rank', 'agent']);

    // Update ALL admin users to have full permissions
    const { rows: adminRows } = await sql`
      UPDATE users
      SET permissions = ${adminPermissions}::jsonb
      WHERE role = 'admin'
      RETURNING id, username, role, permissions
    `;

    // Update ALL regular users to have standard permissions (without admin)
    const { rows: userRows } = await sql`
      UPDATE users
      SET permissions = ${userPermissions}::jsonb
      WHERE role = 'user'
      RETURNING id, username, role, permissions
    `;

    return NextResponse.json({
      success: true,
      message: 'All user permissions updated',
      adminsUpdated: adminRows.length,
      usersUpdated: userRows.length,
      admins: adminRows,
      users: userRows
    });
  } catch (error) {
    console.error('Fix permissions error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
