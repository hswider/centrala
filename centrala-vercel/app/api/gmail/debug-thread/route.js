import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// GET - Debug: Check for duplicate messages in a thread
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get('threadId');

  if (!threadId) {
    return NextResponse.json({ error: 'threadId required' }, { status: 400 });
  }

  try {
    // Get all messages for this thread
    const messages = await sql`
      SELECT id, thread_id, from_email, subject,
             LEFT(body_text, 100) as body_preview,
             sent_at, is_outgoing, created_at
      FROM gmail_messages
      WHERE thread_id = ${threadId}
      ORDER BY sent_at ASC
    `;

    // Check for potential duplicates (same sent_at and from_email)
    const duplicates = await sql`
      SELECT from_email, sent_at, COUNT(*) as count,
             ARRAY_AGG(id) as message_ids
      FROM gmail_messages
      WHERE thread_id = ${threadId}
      GROUP BY from_email, sent_at
      HAVING COUNT(*) > 1
    `;

    return NextResponse.json({
      success: true,
      threadId,
      messagesCount: messages.rows.length,
      messages: messages.rows,
      duplicates: duplicates.rows
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove duplicate messages (keep oldest by created_at)
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get('threadId');

  if (!threadId) {
    return NextResponse.json({ error: 'threadId required' }, { status: 400 });
  }

  try {
    // Delete duplicates, keeping the one with earliest created_at
    const result = await sql`
      DELETE FROM gmail_messages
      WHERE id IN (
        SELECT id FROM (
          SELECT id,
                 ROW_NUMBER() OVER (PARTITION BY thread_id, from_email, sent_at ORDER BY created_at ASC) as rn
          FROM gmail_messages
          WHERE thread_id = ${threadId}
        ) sub
        WHERE rn > 1
      )
      RETURNING id
    `;

    return NextResponse.json({
      success: true,
      deletedCount: result.rows.length,
      deletedIds: result.rows.map(r => r.id)
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
