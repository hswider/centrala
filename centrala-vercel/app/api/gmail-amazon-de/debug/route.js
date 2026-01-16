import { NextResponse } from 'next/server';
import { initDatabase } from '../../../../lib/db';
import {
  isAuthenticated,
  getThreadsList,
  getThread,
  parseMessage
} from '../../../../lib/gmail-amazon-de';

export async function GET(request) {
  try {
    await initDatabase();

    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const test = searchParams.get('test');

    if (test === 'threads') {
      // Get raw threads list
      const threadsResponse = await getThreadsList(10);
      return NextResponse.json({
        success: true,
        threadsCount: threadsResponse.threads?.length || 0,
        threads: threadsResponse.threads?.slice(0, 5).map(t => ({
          id: t.id,
          snippet: t.snippet?.substring(0, 100)
        }))
      });
    }

    if (test === 'thread') {
      const threadId = searchParams.get('threadId');
      if (!threadId) {
        return NextResponse.json({ success: false, error: 'threadId required' });
      }
      const thread = await getThread(threadId);
      const messages = thread.messages || [];
      return NextResponse.json({
        success: true,
        threadId,
        messagesCount: messages.length,
        messages: messages.map(m => {
          const parsed = parseMessage(m);
          return {
            id: parsed.id,
            from: parsed.from,
            fromEmail: parsed.fromEmail,
            subject: parsed.subject,
            date: parsed.date,
            orderId: parsed.orderId,
            hasAttachments: parsed.hasAttachments,
            attachments: parsed.attachments
          };
        })
      });
    }

    if (test === 'attachments') {
      // Debug attachment extraction
      const threadId = searchParams.get('threadId');
      if (!threadId) {
        return NextResponse.json({ success: false, error: 'threadId required' });
      }
      const thread = await getThread(threadId);
      const messages = thread.messages || [];

      // Show raw payload structure to debug attachment detection
      return NextResponse.json({
        success: true,
        threadId,
        messagesCount: messages.length,
        messages: messages.map(m => {
          const parsed = parseMessage(m);

          // Collect all parts info for debugging
          const collectParts = (parts, depth = 0) => {
            if (!parts) return [];
            return parts.flatMap(p => {
              const partInfo = {
                depth,
                mimeType: p.mimeType,
                filename: p.filename || null,
                hasBody: !!p.body,
                bodySize: p.body?.size || 0,
                attachmentId: p.body?.attachmentId || null,
                hasData: !!p.body?.data,
                partId: p.partId
              };
              if (p.parts) {
                return [partInfo, ...collectParts(p.parts, depth + 1)];
              }
              return [partInfo];
            });
          };

          return {
            id: m.id,
            payloadMimeType: m.payload?.mimeType,
            payloadFilename: m.payload?.filename,
            payloadBodyAttachmentId: m.payload?.body?.attachmentId,
            parts: collectParts(m.payload?.parts),
            parsed: {
              hasAttachments: parsed.hasAttachments,
              attachments: parsed.attachments
            }
          };
        })
      });
    }

    if (test === 'sync-test') {
      // Test full sync process for one thread
      const threadsResponse = await getThreadsList(5);
      const threads = threadsResponse.threads || [];
      const results = [];

      for (const threadSummary of threads.slice(0, 2)) {
        try {
          const fullThread = await getThread(threadSummary.id);

          if (!fullThread.messages || fullThread.messages.length === 0) {
            results.push({ id: threadSummary.id, status: 'no messages' });
            continue;
          }

          const firstMessage = parseMessage(fullThread.messages[0]);
          results.push({
            id: threadSummary.id,
            status: 'parsed',
            fromEmail: firstMessage.fromEmail,
            subject: firstMessage.subject,
            orderId: firstMessage.orderId,
            messagesCount: fullThread.messages.length
          });
        } catch (e) {
          results.push({ id: threadSummary.id, status: 'error', error: e.message });
        }
      }

      return NextResponse.json({ success: true, results });
    }

    if (test === 'db') {
      // Check what's in database
      const { sql } = await import('@vercel/postgres');
      const threadId = searchParams.get('threadId');

      if (threadId) {
        // Get specific thread's messages with attachment info
        const messages = await sql`SELECT id, thread_id, from_email, from_name, subject, has_attachments, attachments, LEFT(body_text, 200) as body_preview FROM gmail_amazon_de_messages WHERE thread_id = ${threadId} ORDER BY sent_at DESC`;
        return NextResponse.json({
          success: true,
          threadId,
          messages: messages.rows
        });
      }

      const threads = await sql`SELECT id, from_name, from_email, subject, marketplace, asin, order_id, unread, status, needs_response, has_seller_reply, last_customer_message_at FROM gmail_amazon_de_threads ORDER BY last_message_at DESC LIMIT 10`;
      const messages = await sql`SELECT id, thread_id, from_email, from_name, subject, has_attachments, attachments, LEFT(body_text, 200) as body_preview FROM gmail_amazon_de_messages ORDER BY sent_at DESC LIMIT 10`;
      return NextResponse.json({
        success: true,
        threads: threads.rows,
        messages: messages.rows
      });
    }

    // Default: show last sync status and basic info
    const threadsResponse = await getThreadsList(5);
    return NextResponse.json({
      success: true,
      authenticated: true,
      recentThreads: threadsResponse.threads?.length || 0,
      firstThread: threadsResponse.threads?.[0] ? {
        id: threadsResponse.threads[0].id,
        snippet: threadsResponse.threads[0].snippet?.substring(0, 100)
      } : null
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
