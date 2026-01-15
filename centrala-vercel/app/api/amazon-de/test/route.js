import { NextResponse } from 'next/server';
import { initDatabase } from '../../../../lib/db';
import { getValidAccessToken, isAuthenticated } from '../../../../lib/amazon-de';

const SP_API_BASE_URL = 'https://sellingpartnerapi-eu.amazon.com';

// Test endpoint to explore Amazon SP-API capabilities
export async function GET(request) {
  try {
    await initDatabase();

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'orderId parameter required' }, { status: 400 });
    }

    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const accessToken = await getValidAccessToken();
    const results = {};

    // Helper function to make API calls
    const apiCall = async (path, name) => {
      try {
        const response = await fetch(`${SP_API_BASE_URL}${path}`, {
          headers: {
            'x-amz-access-token': accessToken,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        return { status: response.status, data };
      } catch (e) {
        return { error: e.message };
      }
    };

    // 1. Get order details
    results.order = await apiCall(`/orders/v0/orders/${orderId}`, 'order');

    // 2. Get order items
    results.orderItems = await apiCall(`/orders/v0/orders/${orderId}/orderItems`, 'orderItems');

    // 3. Get buyer info (requires restricted data)
    results.buyerInfo = await apiCall(`/orders/v0/orders/${orderId}/buyerInfo`, 'buyerInfo');

    // 4. Get messaging actions for order (what messaging options are available)
    const marketplaceId = 'A13V1IB3VIYBER'; // Amazon.fr - French marketplace
    results.messagingActions = await apiCall(
      `/messaging/v1/orders/${orderId}?marketplaceIds=${marketplaceId}`,
      'messagingActions'
    );

    // 5. Get attributes (buyer preferences)
    results.attributes = await apiCall(
      `/messaging/v1/orders/${orderId}/attributes?marketplaceIds=${marketplaceId}`,
      'attributes'
    );

    // 6. Try to get order address (shipping info)
    results.orderAddress = await apiCall(`/orders/v0/orders/${orderId}/address`, 'orderAddress');

    // 7. Check if there's any regulated info
    results.regulatedInfo = await apiCall(`/orders/v0/orders/${orderId}/regulatedInfo`, 'regulatedInfo');

    // 8. Try German marketplace as well
    const marketplaceIdDE = 'A1PA6795UKMFR9'; // Amazon.de
    results.messagingActionsDE = await apiCall(
      `/messaging/v1/orders/${orderId}?marketplaceIds=${marketplaceIdDE}`,
      'messagingActionsDE'
    );

    // 9. Let's try to list orders with buyer-seller messaging filter
    // This might show orders that have messages
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    results.ordersWithMessages = await apiCall(
      `/orders/v0/orders?MarketplaceIds=${marketplaceId}&CreatedAfter=${thirtyDaysAgo.toISOString()}&MaxResultsPerPage=10`,
      'ordersWithMessages'
    );

    // 10. Check Solicitations API (for requesting reviews, might have message info)
    results.solicitations = await apiCall(
      `/solicitations/v1/orders/${orderId}?marketplaceIds=${marketplaceId}`,
      'solicitations'
    );

    return NextResponse.json({
      success: true,
      orderId,
      results
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
