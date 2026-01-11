import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { initDatabase } from '@/lib/db';

export async function GET() {
  try {
    await initDatabase();

    const { rows } = await sql`
      SELECT delivery_status as status, COUNT(*) as count
      FROM orders
      WHERE ordered_at >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY delivery_status
      ORDER BY count DESC
    `;

    return NextResponse.json({
      statuses: rows.map(r => ({
        status: r.status,
        count: parseInt(r.count)
      }))
    });
  } catch (error) {
    console.error('[API] Error fetching statuses:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
