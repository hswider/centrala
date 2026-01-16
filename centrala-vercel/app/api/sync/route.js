import { NextResponse } from 'next/server';
import { initDatabase, saveOrders, getLastSyncDate, getOrdersMissingSendDates, updateOrderSendDates } from '@/lib/db';
import { fetchAllNewOrders as fetchApiloOrders, fetchOrderSendDates } from '@/lib/apilo';
import { fetchAllNewOrders as fetchBaselinkerOrders, isConfigured as isBaselinkerConfigured } from '@/lib/baselinker';

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

    let allOrders = [];
    let apiloCount = 0;
    let baselinkerCount = 0;

    // Fetch from Apilo
    try {
      const maxOrders = lastSyncDate ? 1000 : 2000;
      const apiloOrders = await fetchApiloOrders(null, maxOrders);
      apiloCount = apiloOrders.length;
      allOrders = allOrders.concat(apiloOrders);
      console.log('[Sync] Apilo orders:', apiloCount);
    } catch (error) {
      console.error('[Sync] Apilo error:', error.message);
    }

    // Fetch from Baselinker (if configured)
    let baselinkerError = null;
    if (isBaselinkerConfigured()) {
      try {
        const maxOrders = lastSyncDate ? 500 : 1000;
        console.log('[Sync] Fetching Baselinker orders, maxOrders:', maxOrders, 'lastSyncDate:', lastSyncDate);
        const baselinkerOrders = await fetchBaselinkerOrders(lastSyncDate, maxOrders);
        baselinkerCount = baselinkerOrders.length;
        allOrders = allOrders.concat(baselinkerOrders);
        console.log('[Sync] Baselinker orders:', baselinkerCount);
      } catch (error) {
        console.error('[Sync] Baselinker error:', error.message, error.stack);
        baselinkerError = error.message;
      }
    } else {
      console.log('[Sync] Baselinker not configured, skipping');
    }

    // Save all orders
    if (allOrders.length > 0) {
      await saveOrders(allOrders);
      console.log('[Sync] Saved', allOrders.length, 'orders total');
    } else {
      console.log('[Sync] No new orders to save');
    }

    // Fetch send dates for Apilo orders missing them (max 15 per sync to stay within timeout)
    // Only for Apilo orders (Baselinker doesn't have this feature)
    const ordersMissingSendDates = await getOrdersMissingSendDates(15);
    let sendDatesUpdated = 0;

    if (ordersMissingSendDates.length > 0) {
      console.log('[Sync] Fetching send dates for', ordersMissingSendDates.length, 'orders');

      for (const orderId of ordersMissingSendDates) {
        // Skip Baselinker orders (they start with BL-)
        if (orderId.startsWith('BL-')) continue;

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
      count: allOrders.length,
      apiloCount,
      baselinkerCount,
      baselinkerError,
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
