import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// GET - Find thread by email or subject
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const subject = searchParams.get('subject');

  if (!email && !subject) {
    return NextResponse.json({ error: 'email or subject required' }, { status: 400 });
  }

  try {
    let threads;

    if (email) {
      threads = await sql`
        SELECT t.id, t.subject, t.from_email, t.from_name, t.last_message_at, t.messages_count,
               (SELECT COUNT(*) FROM gmail_messages m WHERE m.thread_id = t.id) as actual_messages
        FROM gmail_threads t
        WHERE t.from_email ILIKE ${`%${email}%`}
        ORDER BY t.last_message_at DESC
        LIMIT 10
      `;
    } else {
      threads = await sql`
        SELECT t.id, t.subject, t.from_email, t.from_name, t.last_message_at, t.messages_count,
               (SELECT COUNT(*) FROM gmail_messages m WHERE m.thread_id = t.id) as actual_messages
        FROM gmail_threads t
        WHERE t.subject ILIKE ${`%${subject}%`}
        ORDER BY t.last_message_at DESC
        LIMIT 10
      `;
    }

    return NextResponse.json({
      success: true,
      threads: threads.rows
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
