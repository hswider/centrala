import { NextResponse } from 'next/server';
import { initDatabase, saveOrders, getLastSyncDate, getOrdersMissingSendDates, updateOrderSendDates } from '@/lib/db';
import { fetchAllNewOrders, fetchOrderSendDates } from '@/lib/apilo';

export async function GET(request) {
  // Verify cron secret for security (optional)
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
      // Allow without auth if no secret is set
    }
  }

  try {
    console.log('[Sync] Starting synchronization...');

    await initDatabase();

    // Get last sync date to only fetch new/updated orders
    const lastSyncDate = await getLastSyncDate();
    console.log('[Sync] Last sync:', lastSyncDate);

    // Fetch all orders (new ones will be added, existing ones updated)
    // On first sync (no lastSyncDate), fetch up to 2000 orders
    // On subsequent syncs, fetch only updated orders
    const maxOrders = lastSyncDate ? 1000 : 2000;
    const orders = await fetchAllNewOrders(null, maxOrders);

    if (orders.length > 0) {
      await saveOrders(orders);
      console.log('[Sync] Saved', orders.length, 'orders');
    } else {
      console.log('[Sync] No new orders to save');
    }

    // Fetch send dates for orders missing them (max 15 per sync to stay within timeout)
    const ordersMissingSendDates = await getOrdersMissingSendDates(15);
    let sendDatesUpdated = 0;

    if (ordersMissingSendDates.length > 0) {
      console.log('[Sync] Fetching send dates for', ordersMissingSendDates.length, 'orders');

      for (const orderId of ordersMissingSendDates) {
        const sendDates = await fetchOrderSendDates(orderId);
        if (sendDates) {
          await updateOrderSendDates(orderId, sendDates.sendDateMin, sendDates.sendDateMax);
          sendDatesUpdated++;
        }
        // Small delay to respect API rate limits (150 req/min)
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log('[Sync] Updated send dates for', sendDatesUpdated, 'orders');
    }

    return NextResponse.json({
      success: true,
      count: orders.length,
      sendDatesUpdated,
      ordersMissingSendDates: ordersMissingSendDates.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Sync] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  return GET(request);
}
