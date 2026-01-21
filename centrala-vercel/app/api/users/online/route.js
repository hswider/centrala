import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { initDatabase } from '../../../../lib/db';

// GET - get all users with online status
export async function GET() {
  try {
    await initDatabase();

    // User is considered online if last_activity was within last 10 minutes
    const { rows } = await sql`
      SELECT
        id,
        username,
        role,
        last_activity,
        CASE
          WHEN last_activity > NOW() - INTERVAL '10 minutes' THEN true
          ELSE false
        END as is_online
      FROM users
      ORDER BY
        CASE WHEN last_activity > NOW() - INTERVAL '10 minutes' THEN 0 ELSE 1 END,
        username ASC
    `;

    return NextResponse.json({
      success: true,
      users: rows.map(u => ({
        id: u.id,
        username: u.username,
        role: u.role,
        isOnline: u.is_online,
        lastActivity: u.last_activity
      }))
    });
  } catch (error) {
    console.error('Users online GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
