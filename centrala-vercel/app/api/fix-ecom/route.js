import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    // Update admin users to have ecom permission
    await sql`UPDATE users SET permissions = '["dashboard","oms","wms","mes","mts","dms","ecom","crm","crm-eu","rank","agent","admin"]'::jsonb WHERE role = 'admin'`;

    // Add ecom to hswider
    await sql`UPDATE users SET permissions = permissions || '["ecom"]'::jsonb WHERE username = 'hswider' AND NOT (permissions @> '["ecom"]'::jsonb)`;

    // Get updated users
    const result = await sql`SELECT username, role, permissions FROM users ORDER BY role DESC, username`;

    return NextResponse.json({
      success: true,
      message: 'ECOM permissions granted',
      users: result.rows
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
