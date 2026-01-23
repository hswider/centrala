import { NextResponse } from 'next/server';
import { isAuthenticated } from '../../../../lib/gmail-poomfurniture';
import {
  initDatabase,
  getGmailPoomfurnitureThreads,
  getGmailPoomfurnitureSyncStatus,
  getUnreadGmailPoomfurnitureThreadsCount
} from '../../../../lib/db';

// GET - Get threads from database
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
        error: 'Not authenticated with Gmail POOMFURNITURE',
        requiresAuth: true
      }, { status: 401 });
    }

    // Get status action
    if (action === 'status') {
      const syncStatus = await getGmailPoomfurnitureSyncStatus();
      const unreadCount = await getUnreadGmailPoomfurnitureThreadsCount();

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
    const result = await getGmailPoomfurnitureThreads(page, perPage, unreadOnly);

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Gmail POOMFURNITURE messages error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
