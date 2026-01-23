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

    const headers = {
      'Authorization': `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const baseUrl = process.env.APILO_BASE_URL;
    const results = {};

    // Test 1: Platform map
    try {
      const res = await axios.get(`${baseUrl}/rest/api/orders/platform/map/`, { headers });
      results.platformMap = { success: true, count: res.data?.length || 0 };
    } catch (e) {
      results.platformMap = { success: false, error: e.message, details: e.response?.data };
    }

    // Test 2: Orders list (small)
    try {
      const res = await axios.get(`${baseUrl}/rest/api/orders/?limit=5`, { headers });
      results.ordersList = {
        success: true,
        count: res.data?.orders?.length || 0,
        firstOrderId: res.data?.orders?.[0]?.id
      };
    } catch (e) {
      results.ordersList = { success: false, error: e.message, details: e.response?.data };
    }

    // Test 3: Orders sorted by updatedAt
    try {
      const res = await axios.get(`${baseUrl}/rest/api/orders/?limit=5&sort=updatedAtDesc`, { headers });
      results.ordersUpdatedAt = {
        success: true,
        count: res.data?.orders?.length || 0,
        firstOrderId: res.data?.orders?.[0]?.id,
        firstUpdatedAt: res.data?.orders?.[0]?.updatedAt
      };
    } catch (e) {
      results.ordersUpdatedAt = { success: false, error: e.message, details: e.response?.data };
    }

    // Test 4: Orders from last 24h
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);
      const res = await axios.get(`${baseUrl}/rest/api/orders/?limit=5&orderedAfter=${encodeURIComponent(oneDayAgo.toISOString())}`, { headers });
      results.ordersLast24h = {
        success: true,
        count: res.data?.orders?.length || 0,
        firstOrderId: res.data?.orders?.[0]?.id
      };
    } catch (e) {
      results.ordersLast24h = { success: false, error: e.message, details: e.response?.data };
    }

    // Test 5: Get specific recent order
    if (results.ordersList?.firstOrderId) {
      try {
        const res = await axios.get(`${baseUrl}/rest/api/orders/${results.ordersList.firstOrderId}/`, { headers });
        results.specificOrder = {
          success: true,
          orderId: res.data?.id,
          orderedAt: res.data?.orderedAt
        };
      } catch (e) {
        results.specificOrder = { success: false, error: e.message, details: e.response?.data };
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      tokenValid: true,
      tests: results
    });
  } catch (error) {
    console.error('[Debug Apilo] Error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.message, details: error.response?.data },
      { status: 500 }
    );
  }
}
