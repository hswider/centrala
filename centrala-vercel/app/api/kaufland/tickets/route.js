import { NextResponse } from 'next/server';
import { initDatabase, getKauflandTickets, getKauflandSyncStatus, getUnreadKauflandTicketsCount } from '../../../../lib/db';
import { isAuthenticated } from '../../../../lib/kaufland';

// GET - Get list of tickets
export async function GET(request) {
  try {
    await initDatabase();

    // Check authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Kaufland API not configured',
        requiresAuth: true
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status') || null; // 'open' or 'closed'
    const marketplace = searchParams.get('marketplace') || null; // 'DE', 'SK', etc.

    const tickets = await getKauflandTickets(limit, offset, status, marketplace);
    const syncStatus = await getKauflandSyncStatus();
    const unreadCount = await getUnreadKauflandTicketsCount();

    return NextResponse.json({
      success: true,
      tickets,
      unreadCount,
      syncStatus: {
        lastSyncAt: syncStatus?.last_sync_at || null,
        syncInProgress: syncStatus?.sync_in_progress || false
      }
    });
  } catch (error) {
    console.error('Get Kaufland tickets error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
