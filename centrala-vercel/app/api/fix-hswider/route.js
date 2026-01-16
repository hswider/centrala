import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const passwordHash = await bcrypt.hash('POOM1234!@', 10);
    const permissions = JSON.stringify(['dashboard', 'oms', 'wms', 'crm', 'agent']);

    // Force update hswider user
    const { rows } = await sql`
      UPDATE users
      SET password_hash = ${passwordHash},
          role = 'user',
          permissions = ${permissions}::jsonb
      WHERE username = 'hswider'
      RETURNING id, username, role, permissions
    `;

    if (rows.length === 0) {
      // User doesn't exist, create it
      const { rows: newRows } = await sql`
        INSERT INTO users (username, password_hash, role, permissions)
        VALUES ('hswider', ${passwordHash}, 'user', ${permissions}::jsonb)
        RETURNING id, username, role, permissions
      `;
      return NextResponse.json({ success: true, action: 'created', user: newRows[0] });
    }

    return NextResponse.json({ success: true, action: 'updated', user: rows[0] });
  } catch (error) {
    console.error('Fix hswider error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
