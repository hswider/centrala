import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// GET - Add status column to gmail_threads if not exists
export async function GET() {
  try {
    // Add status column (new, resolved, unresolved)
    await sql`
      ALTER TABLE gmail_threads
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'new'
    `;

    // Update existing threads - if unread, set to 'new', otherwise 'resolved'
    await sql`
      UPDATE gmail_threads
      SET status = CASE
        WHEN unread = true THEN 'new'
        ELSE 'resolved'
      END
      WHERE status IS NULL OR status = ''
    `;

    return NextResponse.json({
      success: true,
      message: 'Status column added and initialized'
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
