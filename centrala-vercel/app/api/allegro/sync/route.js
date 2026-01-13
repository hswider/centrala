import { NextResponse } from 'next/server';
import { getMessageThreads, getThreadMessages, isAuthenticated } from '../../../../lib/allegro';
import {
  initDatabase,
  saveAllegroThread,
  saveAllegroMessage,
  updateAllegroSyncStatus,
  setAllegroSyncInProgress,
  getAllegroSyncStatus
} from '../../../../lib/db';

// This endpoint is called by Vercel Cron every 5 minutes
// Also can be called manually via POST

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

    // Check if authenticated with Allegro
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated with Allegro',
        requiresAuth: true
      });
    }

    // Check sync status
    const syncStatus = await getAllegroSyncStatus();
    if (syncStatus?.sync_in_progress) {
      return NextResponse.json({
        success: false,
        error: 'Sync already in progress'
      });
    }

    await setAllegroSyncInProgress(true);

    try {
      // Fetch threads from Allegro
      const threadsResponse = await getMessageThreads(50, 0);
      const threads = threadsResponse.threads || [];

      let syncedThreads = 0;
      let syncedMessages = 0;
      let errors = [];

      for (const thread of threads) {
        try {
          // Save thread
          await saveAllegroThread(thread);
          syncedThreads++;

          // Fetch messages for this thread (only last 20)
          const messagesResponse = await getThreadMessages(thread.id, 20);
          const messages = messagesResponse.messages || [];

          for (const message of messages) {
            await saveAllegroMessage(message, thread.id);
            syncedMessages++;
          }
        } catch (threadError) {
          errors.push(`Thread ${thread.id}: ${threadError.message}`);
        }
      }

      await updateAllegroSyncStatus('last_sync_at');
      await setAllegroSyncInProgress(false);

      return NextResponse.json({
        success: true,
        synced: {
          threads: syncedThreads,
          messages: syncedMessages
        },
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (syncError) {
      await setAllegroSyncInProgress(false);
      throw syncError;
    }
  } catch (error) {
    console.error('Allegro sync error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
