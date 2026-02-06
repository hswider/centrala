import { NextResponse } from 'next/server';
import { getThreadsList, getThread, isAuthenticated, parseMessage } from '../../../../lib/gmail';
import {
  initDatabase,
  saveGmailThread,
  saveGmailMessage,
  updateGmailSyncStatus,
  setGmailSyncInProgress,
  getGmailSyncStatus,
  getGmailTokens
} from '../../../../lib/db';

export async function GET(request) {
  return handleSync(request);
}

export async function POST(request) {
  return handleSync(request);
}

async function handleSync(request) {
  try {
    await initDatabase();

    // Optional: Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Allow without secret for manual calls, but check if provided
    if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check if authenticated with Gmail
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated with Gmail',
        requiresAuth: true
      });
    }

    // Check sync status
    const syncStatus = await getGmailSyncStatus();
    if (syncStatus?.sync_in_progress) {
      return NextResponse.json({
        success: false,
        error: 'Sync already in progress'
      });
    }

    await setGmailSyncInProgress(true);

    try {
      // Get our email for determining outgoing messages
      const tokens = await getGmailTokens();
      const ourEmail = tokens?.email?.toLowerCase();

      // Fetch threads from Gmail (max 20)
      const threadsResponse = await getThreadsList(20);
      const threads = threadsResponse.threads || [];

      let syncedThreads = 0;
      let syncedMessages = 0;
      let errors = [];

      for (const threadStub of threads) {
        try {
          // Fetch full thread with messages
          const fullThread = await getThread(threadStub.id);

          if (!fullThread || !fullThread.messages || fullThread.messages.length === 0) {
            continue;
          }

          // Parse messages
          const parsedMessages = fullThread.messages.map(m => parseMessage(m));
          const firstMessage = parsedMessages[0];
          const lastMessage = parsedMessages[parsedMessages.length - 1];

          // Check if thread is unread
          const hasUnread = fullThread.messages.some(m => m.labelIds?.includes('UNREAD'));

          // Save thread
          await saveGmailThread({
            id: threadStub.id,
            subject: firstMessage.subject,
            snippet: fullThread.snippet,
            fromEmail: firstMessage.fromEmail,
            fromName: firstMessage.fromName,
            lastMessageAt: lastMessage.internalDate,
            unread: hasUnread,
            messagesCount: fullThread.messages.length,
            labels: lastMessage.labelIds
          });
          syncedThreads++;

          // Save messages
          for (const parsed of parsedMessages) {
            const isOutgoing = parsed.fromEmail.toLowerCase() === ourEmail;

            await saveGmailMessage({
              id: parsed.id,
              fromEmail: parsed.fromEmail,
              fromName: parsed.fromName,
              to: parsed.to,
              cc: parsed.cc,
              subject: parsed.subject,
              bodyText: parsed.bodyText,
              bodyHtml: parsed.bodyHtml,
              sentAt: parsed.internalDate,
              isOutgoing,
              hasAttachments: parsed.hasAttachments,
              attachments: parsed.attachments
            }, threadStub.id);
            syncedMessages++;
          }
        } catch (threadError) {
          errors.push(`Thread ${threadStub.id}: ${threadError.message}`);
        }
      }

      await updateGmailSyncStatus();
      await setGmailSyncInProgress(false);

      return NextResponse.json({
        success: true,
        synced: {
          threads: syncedThreads,
          messages: syncedMessages
        },
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (syncError) {
      await setGmailSyncInProgress(false);
      throw syncError;
    }
  } catch (error) {
    console.error('Gmail sync error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
