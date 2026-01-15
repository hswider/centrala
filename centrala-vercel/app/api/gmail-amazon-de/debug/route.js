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
            orderId: parsed.orderId
          };
        })
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
