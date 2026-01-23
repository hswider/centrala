import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    // Delete hswider user
    await sql`DELETE FROM users WHERE username = 'hswider'`;

    // Update admin users to have ecom permission
    await sql`UPDATE users SET permissions = '["dashboard","oms","wms","mes","mts","dms","ecom","crm","crm-eu","rank","agent","admin"]'::jsonb WHERE role = 'admin'`;

    // Add ecom to Hubert
    await sql`UPDATE users SET permissions = permissions || '["ecom"]'::jsonb WHERE username = 'Hubert' AND NOT (permissions @> '["ecom"]'::jsonb)`;

    // Get updated users
    const result = await sql`SELECT username, role, permissions FROM users ORDER BY role DESC, username`;

    return NextResponse.json({
      success: true,
      message: 'hswider deleted, ECOM permissions granted',
      users: result.rows
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
