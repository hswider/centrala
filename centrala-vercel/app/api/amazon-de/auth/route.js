import { NextResponse } from 'next/server';
import { initDatabase, getAmazonDeSyncStatus } from '../../../../lib/db';
import { isAuthenticated, getValidAccessToken } from '../../../../lib/amazon-de';

// GET - Check authentication status
export async function GET() {
  try {
    await initDatabase();

    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        message: 'Amazon DE credentials not configured. Add AMAZON_DE_CLIENT_ID, AMAZON_DE_CLIENT_SECRET, AMAZON_DE_REFRESH_TOKEN to environment variables.'
      });
    }

    // Try to get a valid access token to verify credentials work
    try {
      await getValidAccessToken();
    } catch (tokenError) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        error: tokenError.message,
        message: 'Credentials configured but token refresh failed. Check your credentials.'
      });
    }

    const syncStatus = await getAmazonDeSyncStatus();

    return NextResponse.json({
      success: true,
      authenticated: true,
      syncStatus: {
        lastSyncAt: syncStatus?.last_sync_at || null,
        syncInProgress: syncStatus?.sync_in_progress || false
      }
    });
  } catch (error) {
    console.error('Amazon DE auth check error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
