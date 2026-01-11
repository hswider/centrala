import { NextResponse } from 'next/server';
import axios from 'axios';
import { getTokens, initDatabase } from '@/lib/db';

export async function GET(request) {
  try {
    await initDatabase();
    const tokens = await getTokens();

    if (!tokens?.access_token) {
      return NextResponse.json({ error: 'No tokens' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const checkOrderId = searchParams.get('orderId');

    const headers = {
      'Authorization': `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const baseUrl = process.env.APILO_BASE_URL;

    // If specific order requested, fetch it with full details
    if (checkOrderId) {
      try {
        const orderRes = await axios.get(`${baseUrl}/rest/api/orders/${checkOrderId}/`, { headers });
        const order = orderRes.data;

        // Return full raw order to see all available fields
        return NextResponse.json({
          orderId: checkOrderId,
          found: true,
          rawOrder: order
        });
      } catch (e) {
        return NextResponse.json({
          orderId: checkOrderId,
          found: false,
          error: e.message,
          apiError: e.response?.data
        });
      }
    }

    // Get platform map
    const platformMapRes = await axios.get(`${baseUrl}/rest/api/orders/platform/map/`, { headers });

    // Build platform map like in apilo.js
    const platformMap = {};
    if (Array.isArray(platformMapRes.data)) {
      platformMapRes.data.forEach(p => {
        platformMap[p.id] = {
          name: p.description || p.name,
          platform: p.name
        };
      });
    }

    // Try different API queries to find newer orders
    const today = new Date().toISOString().split('T')[0];

    // Query 1: Default sort
    const res1 = await axios.get(`${baseUrl}/rest/api/orders/?limit=10&sort=orderedAtDesc`, { headers });

    // Query 2: Try with updatedAfter filter for today
    let res2orders = [];
    try {
      const todayStart = `${today}T00:00:00+01:00`;
      const res2 = await axios.get(`${baseUrl}/rest/api/orders/?limit=50&updatedAfter=${encodeURIComponent(todayStart)}`, { headers });
      res2orders = res2.data?.orders || [];
    } catch (e) {
      res2orders = [];
    }

    // Query 3: Try with orderedAfter filter
    let res3orders = [];
    try {
      const todayStart = `${today}T00:00:00+01:00`;
      const res3 = await axios.get(`${baseUrl}/rest/api/orders/?limit=50&orderedAfter=${encodeURIComponent(todayStart)}`, { headers });
      res3orders = res3.data?.orders || [];
    } catch (e) {
      res3orders = [];
    }

    const orders = res1.data?.orders || [];

    // Check results
    const foundInList = {
      defaultSort: {
        count: orders.length,
        first: orders[0]?.id,
        ids: orders.slice(0, 5).map(o => o.id)
      },
      updatedAfterToday: {
        count: res2orders.length,
        ids: res2orders.slice(0, 10).map(o => o.id)
      },
      orderedAfterToday: {
        count: res3orders.length,
        ids: res3orders.slice(0, 10).map(o => o.id)
      }
    };

    // Show the 3 newest orders with full details
    const newestOrders = orders.slice(0, 3).map(o => {
      const platformId = o.platformAccountId || o.platformId;
      const platformInfo = platformMap[platformId];
      return {
        id: o.id,
        platformAccountId: o.platformAccountId,
        platformIdType: typeof o.platformAccountId,
        lookupKey: platformId,
        lookupKeyType: typeof platformId,
        platformInfoFound: !!platformInfo,
        platformInfo,
        finalLabel: platformInfo?.name || `Platform ${platformId}`,
        orderedAt: o.orderedAt
      };
    });

    // Find orders with different platforms (especially Amazon)
    const amazonOrders = orders.filter(o => o.platformAccountId >= 100).slice(0, 5);
    const allegroOrders = orders.filter(o => o.platformAccountId < 100).slice(0, 3);

    const debugOrders = [...amazonOrders, ...allegroOrders].map(o => {
      const platformId = o.platformAccountId || o.platformId;
      const platformInfo = platformMap[platformId];
      return {
        id: o.id,
        platformAccountId: o.platformAccountId,
        platformId: o.platformId,
        platformIdType: typeof o.platformAccountId,
        mapKeyExists: platformId in platformMap,
        platformInfo: platformInfo || null,
        mappedLabel: platformInfo?.name || `Platform ${platformId}`,
        mappedPlatform: platformInfo?.platform || 'Unknown'
      };
    });

    // Show available platform IDs >= 100 (Amazon range)
    const amazonPlatforms = Object.entries(platformMap)
      .filter(([id]) => parseInt(id) >= 100)
      .slice(0, 10)
      .reduce((acc, [id, val]) => { acc[id] = val; return acc; }, {});

    return NextResponse.json({
      totalPlatforms: Object.keys(platformMap).length,
      totalOrdersInBatch: orders.length,
      foundInList,
      firstOrderInBatch: orders[0]?.id,
      newestOrders,
      amazonPlatforms
    });
  } catch (error) {
    console.error('[Debug] Error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.message, details: error.response?.data },
      { status: 500 }
    );
  }
}
