import { NextResponse } from 'next/server';
import {
  initDatabase,
  saveGmailAmazonDeThread,
  saveGmailAmazonDeMessage,
  getGmailAmazonDeSyncStatus,
  updateGmailAmazonDeSyncStatus,
  setGmailAmazonDeSyncInProgress
} from '../../../../lib/db';
import {
  isAuthenticated,
  getThreadsList,
  getThread,
  parseMessage
} from '../../../../lib/gmail-amazon-de';

// POST - Sync messages from Gmail
export async function POST(request) {
  try {
    await initDatabase();

    // Check authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Gmail Amazon DE not authenticated',
        requiresAuth: true
      }, { status: 401 });
    }

    // Check if sync is already in progress
    const syncStatus = await getGmailAmazonDeSyncStatus();
    if (syncStatus?.sync_in_progress) {
      return NextResponse.json({
        success: false,
        error: 'Sync already in progress'
      }, { status: 409 });
    }

    // Set sync in progress
    await setGmailAmazonDeSyncInProgress(true);

    let syncedThreads = 0;
    let syncedMessages = 0;

    try {
      // Get threads from Gmail (Amazon marketplace emails)
      const { searchParams } = new URL(request.url);
      const maxResults = parseInt(searchParams.get('maxResults') || '30');

      const threadsResponse = await getThreadsList(maxResults);
      const threads = threadsResponse.threads || [];

      for (const threadSummary of threads) {
        try {
          // Get full thread with messages
          const fullThread = await getThread(threadSummary.id);

          if (!fullThread.messages || fullThread.messages.length === 0) {
            continue;
          }

          // Parse first message to get thread metadata
          const firstMessage = parseMessage(fullThread.messages[0]);
          const lastMessage = parseMessage(fullThread.messages[fullThread.messages.length - 1]);

          // Check if thread has UNREAD label
          const hasUnread = fullThread.messages.some(m =>
            m.labelIds && m.labelIds.includes('UNREAD')
          );

          // Save thread
          await saveGmailAmazonDeThread({
            id: fullThread.id,
            orderId: firstMessage.orderId,
            buyerEmail: firstMessage.fromEmail,
            buyerName: firstMessage.fromName,
            subject: firstMessage.subject,
            snippet: lastMessage.snippet || fullThread.snippet,
            lastMessageAt: lastMessage.internalDate,
            unread: hasUnread
          });

          syncedThreads++;

          // Save all messages in thread
          for (const message of fullThread.messages) {
            const parsed = parseMessage(message);

            // Determine if message is outgoing (sent by seller)
            const isOutgoing = parsed.labelIds && parsed.labelIds.includes('SENT');

            await saveGmailAmazonDeMessage({
              id: parsed.id,
              sender: isOutgoing ? 'seller' : parsed.fromEmail,
              subject: parsed.subject,
              bodyText: parsed.bodyText,
              bodyHtml: parsed.bodyHtml,
              sentAt: parsed.internalDate,
              isOutgoing
            }, fullThread.id);

            syncedMessages++;
          }
        } catch (threadError) {
          console.error(`Error syncing thread ${threadSummary.id}:`, threadError.message);
        }
      }

      // Update sync status
      await updateGmailAmazonDeSyncStatus();

      return NextResponse.json({
        success: true,
        syncedThreads,
        syncedMessages
      });
    } finally {
      // Always clear sync in progress flag
      await setGmailAmazonDeSyncInProgress(false);
    }
  } catch (error) {
    console.error('Gmail Amazon DE sync error:', error);

    // Try to clear sync in progress flag
    try {
      await setGmailAmazonDeSyncInProgress(false);
    } catch (e) {
      console.error('Failed to clear sync flag:', e.message);
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET - Get sync status
export async function GET() {
  try {
    await initDatabase();

    const syncStatus = await getGmailAmazonDeSyncStatus();

    return NextResponse.json({
      success: true,
      lastSyncAt: syncStatus?.last_sync_at || null,
      syncInProgress: syncStatus?.sync_in_progress || false
    });
  } catch (error) {
    console.error('Get sync status error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
