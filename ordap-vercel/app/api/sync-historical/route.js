import { NextResponse } from 'next/server';
import { initDatabase, saveOrders } from '@/lib/db';
import { fetchOrdersFromDateRange } from '@/lib/apilo';

export const maxDuration = 300; // 5 minutes timeout for Vercel

export async function GET(request) {
  return runSync();
}

export async function POST(request) {
  return runSync();
}

async function runSync() {
  try {
    console.log('[Sync-Historical] Starting historical sync (last 30 days)...');

    await initDatabase();

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch all orders from last 30 days
    const orders = await fetchOrdersFromDateRange(thirtyDaysAgo, 6000);

    if (orders.length > 0) {
      // Save in batches to avoid timeout
      const batchSize = 100;
      let saved = 0;

      for (let i = 0; i < orders.length; i += batchSize) {
        const batch = orders.slice(i, i + batchSize);
        await saveOrders(batch);
        saved += batch.length;
        console.log('[Sync-Historical] Saved batch:', saved, '/', orders.length);
      }

      console.log('[Sync-Historical] Total saved:', orders.length, 'orders');
    } else {
      console.log('[Sync-Historical] No orders found');
    }

    return NextResponse.json({
      success: true,
      count: orders.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Sync-Historical] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
