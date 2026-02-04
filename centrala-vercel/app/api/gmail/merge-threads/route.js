import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { initDatabase } from '../../../../lib/db';

// POST - Merge two threads into one
export async function POST(request) {
  try {
    await initDatabase();

    const body = await request.json();
    const { targetThreadId, sourceThreadId } = body;

    if (!targetThreadId || !sourceThreadId) {
      return NextResponse.json({
        success: false,
        error: 'targetThreadId and sourceThreadId are required'
      }, { status: 400 });
    }

    // Get both threads
    const targetThread = await sql`SELECT * FROM gmail_threads WHERE id = ${targetThreadId}`;
    const sourceThread = await sql`SELECT * FROM gmail_threads WHERE id = ${sourceThreadId}`;

    if (targetThread.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Target thread not found'
      }, { status: 404 });
    }

    if (sourceThread.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Source thread not found'
      }, { status: 404 });
    }

    // Move all messages from source thread to target thread
    const movedMessages = await sql`
      UPDATE gmail_messages
      SET thread_id = ${targetThreadId}
      WHERE thread_id = ${sourceThreadId}
      RETURNING id
    `;

    // Update target thread's message count and last_message_at
    await sql`
      UPDATE gmail_threads
      SET
        messages_count = (SELECT COUNT(*) FROM gmail_messages WHERE thread_id = ${targetThreadId}),
        last_message_at = (SELECT MAX(sent_at) FROM gmail_messages WHERE thread_id = ${targetThreadId}),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${targetThreadId}
    `;

    // Delete the source thread (now empty)
    await sql`DELETE FROM gmail_threads WHERE id = ${sourceThreadId}`;

    return NextResponse.json({
      success: true,
      movedMessages: movedMessages.rows.length,
      targetThreadId,
      deletedSourceThreadId: sourceThreadId
    });
  } catch (error) {
    console.error('Merge threads error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET - Find threads by email or subject (helper to find thread IDs)
export async function GET(request) {
  try {
    await initDatabase();

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const subject = searchParams.get('subject');

    let result;
    if (email) {
      result = await sql`
        SELECT id, subject, from_email, from_name, messages_count, last_message_at, snippet
        FROM gmail_threads
        WHERE from_email ILIKE ${'%' + email + '%'}
        ORDER BY last_message_at DESC
        LIMIT 20
      `;
    } else if (subject) {
      result = await sql`
        SELECT id, subject, from_email, from_name, messages_count, last_message_at, snippet
        FROM gmail_threads
        WHERE subject ILIKE ${'%' + subject + '%'}
        ORDER BY last_message_at DESC
        LIMIT 20
      `;
    } else {
      return NextResponse.json({
        success: false,
        error: 'email or subject parameter required'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      threads: result.rows
    });
  } catch (error) {
    console.error('Search threads error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
