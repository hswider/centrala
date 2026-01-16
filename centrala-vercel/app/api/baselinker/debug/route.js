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

      case 'orders':
        const limit = parseInt(searchParams.get('limit') || '10');
        const orders = await fetchOrders(limit);
        return NextResponse.json({
          success: true,
          count: orders.length,
          orders: orders.slice(0, 5) // Return max 5 orders for debug
        });

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
