import { NextResponse } from 'next/server';
import {
  initDatabase,
  getAmazonDeThreads,
  getAmazonDeSyncStatus,
  getUnreadAmazonDeThreadsCount
} from '../../../../lib/db';
import { isAuthenticated } from '../../../../lib/amazon-de';

// GET - Get messages/threads list
export async function GET(request) {
  try {
    await initDatabase();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Status check (unread count)
    if (action === 'status') {
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        return NextResponse.json({
          success: true,
          authenticated: false,
          status: { unreadCount: 0 }
        });
      }

      const unreadCount = await getUnreadAmazonDeThreadsCount();
      const syncStatus = await getAmazonDeSyncStatus();

      return NextResponse.json({
        success: true,
        authenticated: true,
        status: {
          unreadCount,
          lastSyncAt: syncStatus?.last_sync_at || null,
          syncInProgress: syncStatus?.sync_in_progress || false
        }
      });
    }

    // Check authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Amazon DE credentials not configured',
        requiresAuth: true
      }, { status: 401 });
    }

    // Get threads list
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const data = await getAmazonDeThreads(page, perPage, unreadOnly);
    const syncStatus = await getAmazonDeSyncStatus();

    return NextResponse.json({
      success: true,
      ...data,
      syncStatus: {
        lastSyncAt: syncStatus?.last_sync_at || null,
        syncInProgress: syncStatus?.sync_in_progress || false
      }
    });
  } catch (error) {
    console.error('Get Amazon DE messages error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
