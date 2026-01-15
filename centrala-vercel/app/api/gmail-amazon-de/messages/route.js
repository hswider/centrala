import { NextResponse } from 'next/server';
import { initDatabase, getGmailAmazonDeThreads, getGmailAmazonDeSyncStatus } from '../../../../lib/db';
import { isAuthenticated } from '../../../../lib/gmail-amazon-de';

// GET - Get list of message threads
export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const threads = await getGmailAmazonDeThreads(limit, offset);
    const syncStatus = await getGmailAmazonDeSyncStatus();

    return NextResponse.json({
      success: true,
      threads,
      syncStatus: {
        lastSyncAt: syncStatus?.last_sync_at || null,
        syncInProgress: syncStatus?.sync_in_progress || false
      }
    });
  } catch (error) {
    console.error('Get Gmail Amazon DE messages error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
