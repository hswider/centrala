import { NextResponse } from 'next/server';
import {
  initDatabase,
  saveAmazonDeThread,
  saveAmazonDeMessage,
  updateAmazonDeSyncStatus,
  setAmazonDeSyncInProgress,
  getAmazonDeSyncStatus
} from '../../../../lib/db';
import {
  isAuthenticated,
  getOrders,
  getOrderItems,
  orderToThread,
  orderToMessage
} from '../../../../lib/amazon-de';

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

    if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check if authenticated
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Amazon DE credentials not configured',
        requiresAuth: true
      });
    }

    // Check sync status
    const syncStatus = await getAmazonDeSyncStatus();
    if (syncStatus?.sync_in_progress) {
      return NextResponse.json({
        success: false,
        error: 'Sync already in progress'
      });
    }

    await setAmazonDeSyncInProgress(true);

    try {
      // Fetch orders from Amazon (last 30 days)
      const orders = await getOrders(null, 50);

      let syncedThreads = 0;
      let syncedMessages = 0;
      let errors = [];

      for (const order of orders) {
        try {
          // Get order items for product names
          let items = [];
          try {
            items = await getOrderItems(order.AmazonOrderId);
          } catch (itemsError) {
            console.error(`Failed to get items for order ${order.AmazonOrderId}:`, itemsError.message);
          }

          // Convert order to thread format
          const thread = orderToThread(order, items);
          await saveAmazonDeThread(thread);
          syncedThreads++;

          // Create initial message from order
          const message = orderToMessage(order);
          await saveAmazonDeMessage(message, order.AmazonOrderId);
          syncedMessages++;

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (orderError) {
          errors.push(`Order ${order.AmazonOrderId}: ${orderError.message}`);
        }
      }

      await updateAmazonDeSyncStatus();
      await setAmazonDeSyncInProgress(false);

      return NextResponse.json({
        success: true,
        synced: {
          threads: syncedThreads,
          messages: syncedMessages
        },
        totalOrders: orders.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (syncError) {
      await setAmazonDeSyncInProgress(false);
      throw syncError;
    }
  } catch (error) {
    console.error('Amazon DE sync error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
