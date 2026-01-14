import { NextResponse } from 'next/server';
import { getMessageThreads, getThreadMessages, isAuthenticated } from '../../../../lib/allegro-meblebox';
import {
  initDatabase,
  saveAllegroMebleboxThread,
  saveAllegroMebleboxMessage,
  updateAllegroMebleboxSyncStatus,
  setAllegroMebleboxSyncInProgress,
  getAllegroMebleboxSyncStatus
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

    // Check if authenticated with Allegro
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated with Allegro Meblebox',
        requiresAuth: true
      });
    }

    // Check sync status
    const syncStatus = await getAllegroMebleboxSyncStatus();
    if (syncStatus?.sync_in_progress) {
      return NextResponse.json({
        success: false,
        error: 'Sync already in progress'
      });
    }

    await setAllegroMebleboxSyncInProgress(true);

    try {
      // Fetch threads from Allegro (max 20 per Allegro API limit)
      const threadsResponse = await getMessageThreads(20, 0);
      const threads = threadsResponse.threads || [];

      let syncedThreads = 0;
      let syncedMessages = 0;
      let errors = [];

      for (const thread of threads) {
        try {
          // Save thread
          await saveAllegroMebleboxThread(thread);
          syncedThreads++;

          // Fetch messages for this thread (only last 20)
          const messagesResponse = await getThreadMessages(thread.id, 20);
          const messages = messagesResponse.messages || [];

          for (const message of messages) {
            await saveAllegroMebleboxMessage(message, thread.id);
            syncedMessages++;
          }
        } catch (threadError) {
          errors.push(`Thread ${thread.id}: ${threadError.message}`);
        }
      }

      await updateAllegroMebleboxSyncStatus('last_sync_at');
      await setAllegroMebleboxSyncInProgress(false);

      return NextResponse.json({
        success: true,
        synced: {
          threads: syncedThreads,
          messages: syncedMessages
        },
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (syncError) {
      await setAllegroMebleboxSyncInProgress(false);
      throw syncError;
    }
  } catch (error) {
    console.error('Allegro Meblebox sync error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
