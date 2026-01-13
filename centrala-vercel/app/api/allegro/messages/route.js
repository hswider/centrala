import { NextResponse } from 'next/server';
import { getMessageThreads, getThreadMessages, isAuthenticated } from '../../../../lib/allegro';
import {
  initDatabase,
  getAllegroThreads,
  saveAllegroThread,
  saveAllegroMessage,
  updateAllegroSyncStatus,
  setAllegroSyncInProgress,
  getAllegroSyncStatus,
  getUnreadAllegroThreadsCount
} from '../../../../lib/db';

// GET - Get threads from database or sync from Allegro
export async function GET(request) {
  try {
    await initDatabase();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const page = parseInt(searchParams.get('page')) || 1;
    const perPage = parseInt(searchParams.get('perPage')) || 20;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // Check authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated with Allegro',
        requiresAuth: true
      }, { status: 401 });
    }

    // Sync action - fetch from Allegro and save to database
    if (action === 'sync') {
      const syncStatus = await getAllegroSyncStatus();

      // Prevent concurrent syncs
      if (syncStatus?.sync_in_progress) {
        return NextResponse.json({
          success: false,
          error: 'Sync already in progress'
        }, { status: 409 });
      }

      await setAllegroSyncInProgress(true);

      try {
        // Fetch threads from Allegro (up to 100)
        const threadsResponse = await getMessageThreads(100, 0);
        const threads = threadsResponse.threads || [];

        let syncedThreads = 0;
        let syncedMessages = 0;

        for (const thread of threads) {
          // Save thread
          await saveAllegroThread(thread);
          syncedThreads++;

          // Fetch messages for this thread
          try {
            const messagesResponse = await getThreadMessages(thread.id, 50);
            const messages = messagesResponse.messages || [];

            for (const message of messages) {
              await saveAllegroMessage(message, thread.id);
              syncedMessages++;
            }
          } catch (msgError) {
            console.error(`Failed to sync messages for thread ${thread.id}:`, msgError.message);
          }
        }

        await updateAllegroSyncStatus('last_sync_at');
        await setAllegroSyncInProgress(false);

        return NextResponse.json({
          success: true,
          synced: {
            threads: syncedThreads,
            messages: syncedMessages
          }
        });
      } catch (syncError) {
        await setAllegroSyncInProgress(false);
        throw syncError;
      }
    }

    // Get status action
    if (action === 'status') {
      const syncStatus = await getAllegroSyncStatus();
      const unreadCount = await getUnreadAllegroThreadsCount();

      return NextResponse.json({
        success: true,
        status: {
          lastSyncAt: syncStatus?.last_sync_at,
          syncInProgress: syncStatus?.sync_in_progress || false,
          unreadCount
        }
      });
    }

    // Default: Get threads from database
    const result = await getAllegroThreads(page, perPage, unreadOnly);

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Allegro messages error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
