import { NextResponse } from 'next/server';
import { isConfigured, fetchOrders, getOrderStatuses, getOrderSources } from '../../../../lib/baselinker';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const test = searchParams.get('test');

    // Check if configured
    if (!isConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'BASELINKER_API_KEY not configured',
        configured: false
      }, { status: 401 });
    }

    switch (test) {
      case 'statuses':
        const statuses = await getOrderStatuses();
        return NextResponse.json({ success: true, statuses });

      case 'sources':
        const sources = await getOrderSources();
        return NextResponse.json({ success: true, sources });

      case 'orders': {
        const limit = parseInt(searchParams.get('limit') || '10');
        try {
          const orders = await fetchOrders(limit);
          return NextResponse.json({
            success: true,
            count: orders.length,
            orders: orders.slice(0, 5) // Return max 5 orders for debug
          });
        } catch (orderError) {
          return NextResponse.json({
            success: false,
            error: orderError.message,
            stack: orderError.stack
          }, { status: 500 });
        }
      }

      case 'raw-orders':
        // Test raw API call without mapping
        try {
          const apiKey = process.env.BASELINKER_API_KEY;
          const formData = new URLSearchParams();
          formData.append('method', 'getOrders');
          formData.append('parameters', JSON.stringify({
            get_unconfirmed_orders: true,
            date_from: Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)
          }));

          const response = await fetch('https://api.baselinker.com/connector.php', {
            method: 'POST',
            headers: {
              'X-BLToken': apiKey,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
          });

          const data = await response.json();
          return NextResponse.json({
            success: true,
            status: data.status,
            orderCount: data.orders ? data.orders.length : 0,
            sampleOrder: data.orders && data.orders.length > 0 ? data.orders[0] : null,
            sampleProducts: data.orders && data.orders.length > 0 ? data.orders[0].products : null,
            error_code: data.error_code,
            error_message: data.error_message
          });
        } catch (rawError) {
          return NextResponse.json({
            success: false,
            error: rawError.message
          }, { status: 500 });
        }

      default:
        // Default: test connection by fetching statuses
        const testStatuses = await getOrderStatuses();
        return NextResponse.json({
          success: true,
          configured: true,
          message: 'Baselinker API connected',
          statusCount: testStatuses.length
        });
    }
  } catch (error) {
    console.error('Baselinker debug error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
