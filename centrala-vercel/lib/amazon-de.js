// Amazon SP-API Integration for Amazon DE (Germany)
// Uses LWA (Login with Amazon) OAuth 2.0 for authentication

import { getAmazonDeTokens, saveAmazonDeTokens } from './db';

const LWA_TOKEN_URL = 'https://api.amazon.com/auth/o2/token';
const SP_API_BASE_URL = 'https://sellingpartnerapi-eu.amazon.com';
const MARKETPLACE_ID = process.env.AMAZON_DE_MARKETPLACE_ID || 'A1PA6795UKMFR9'; // Amazon.de

// Get valid access token (refresh if expired)
export async function getValidAccessToken() {
  const tokens = await getAmazonDeTokens();
  const now = Date.now();

  // Check if we have a valid access token (with 5 min buffer)
  if (tokens?.access_token && tokens?.expires_at && tokens.expires_at > now + 300000) {
    return tokens.access_token;
  }

  // Need to refresh the token using LWA
  const clientId = process.env.AMAZON_DE_CLIENT_ID;
  const clientSecret = process.env.AMAZON_DE_CLIENT_SECRET;
  const refreshToken = process.env.AMAZON_DE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Amazon DE credentials not configured');
  }

  const response = await fetch(LWA_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('LWA token refresh failed:', error);
    throw new Error(`Failed to refresh Amazon token: ${response.status}`);
  }

  const data = await response.json();
  const expiresAt = now + (data.expires_in * 1000);

  // Save the new access token
  await saveAmazonDeTokens(data.access_token, expiresAt);

  return data.access_token;
}

// Check if authenticated
export async function isAuthenticated() {
  try {
    const clientId = process.env.AMAZON_DE_CLIENT_ID;
    const clientSecret = process.env.AMAZON_DE_CLIENT_SECRET;
    const refreshToken = process.env.AMAZON_DE_REFRESH_TOKEN;

    return !!(clientId && clientSecret && refreshToken);
  } catch (e) {
    return false;
  }
}

// Make authenticated request to SP-API
async function spApiRequest(path, options = {}) {
  const accessToken = await getValidAccessToken();

  const url = `${SP_API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'x-amz-access-token': accessToken,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`SP-API request failed: ${path}`, error);
    throw new Error(`SP-API request failed: ${response.status} - ${error}`);
  }

  return response.json();
}

// Get orders list from Amazon DE
export async function getOrders(createdAfter = null, maxResults = 50) {
  const params = new URLSearchParams({
    MarketplaceIds: MARKETPLACE_ID,
    MaxResultsPerPage: maxResults.toString(),
  });

  if (createdAfter) {
    params.append('CreatedAfter', createdAfter);
  } else {
    // Default to last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    params.append('CreatedAfter', thirtyDaysAgo.toISOString());
  }

  const data = await spApiRequest(`/orders/v0/orders?${params.toString()}`);
  return data.payload?.Orders || [];
}

// Get single order details
export async function getOrder(orderId) {
  const data = await spApiRequest(`/orders/v0/orders/${orderId}`);
  return data.payload;
}

// Get order items
export async function getOrderItems(orderId) {
  const data = await spApiRequest(`/orders/v0/orders/${orderId}/orderItems`);
  return data.payload?.OrderItems || [];
}

// Get buyer info for an order (requires additional role)
export async function getOrderBuyerInfo(orderId) {
  try {
    const data = await spApiRequest(`/orders/v0/orders/${orderId}/buyerInfo`);
    return data.payload;
  } catch (e) {
    // Buyer info might not be available without restricted data access
    console.error('Could not get buyer info:', e.message);
    return null;
  }
}

// Get messaging actions available for an order
export async function getMessagingActions(orderId) {
  try {
    const params = new URLSearchParams({
      marketplaceIds: MARKETPLACE_ID,
    });
    const data = await spApiRequest(`/messaging/v1/orders/${orderId}?${params.toString()}`);
    return data.payload || data;
  } catch (e) {
    console.error('Could not get messaging actions:', e.message);
    return null;
  }
}

// Send message to buyer (Contact Buyer - Unexpected Problem)
export async function sendUnexpectedProblemMessage(orderId, text) {
  const params = new URLSearchParams({
    marketplaceIds: MARKETPLACE_ID,
  });

  const body = {
    text: text,
  };

  const data = await spApiRequest(
    `/messaging/v1/orders/${orderId}/messages/unexpectedProblem?${params.toString()}`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );

  return data;
}

// Send confirmation of shipment customization details
export async function sendCustomizationDetailsConfirmation(orderId, text, fileLinks = []) {
  const params = new URLSearchParams({
    marketplaceIds: MARKETPLACE_ID,
  });

  const body = {
    text: text,
  };

  if (fileLinks.length > 0) {
    body.attachments = fileLinks.map(link => ({ uploadDestinationId: link }));
  }

  const data = await spApiRequest(
    `/messaging/v1/orders/${orderId}/messages/confirmCustomizationDetails?${params.toString()}`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );

  return data;
}

// Send confirmation of delivery details
export async function sendDeliveryDetailsConfirmation(orderId, text) {
  const params = new URLSearchParams({
    marketplaceIds: MARKETPLACE_ID,
  });

  const body = {
    text: text,
  };

  const data = await spApiRequest(
    `/messaging/v1/orders/${orderId}/messages/confirmDeliveryDetails?${params.toString()}`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );

  return data;
}

// Create confirmation of service details request
export async function sendServiceDetailsConfirmation(orderId, text) {
  const params = new URLSearchParams({
    marketplaceIds: MARKETPLACE_ID,
  });

  const body = {
    text: text,
  };

  const data = await spApiRequest(
    `/messaging/v1/orders/${orderId}/messages/confirmServiceDetails?${params.toString()}`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );

  return data;
}

// Parse order to thread format for our database
export function orderToThread(order, items = []) {
  const orderTotal = parseFloat(order.OrderTotal?.Amount) || 0;
  const currency = order.OrderTotal?.CurrencyCode || 'EUR';

  // Get product names from items
  const productNames = items
    .map(item => item.Title)
    .filter(Boolean)
    .slice(0, 2)
    .join(', ');

  return {
    id: order.AmazonOrderId,
    orderId: order.AmazonOrderId,
    buyerName: order.BuyerInfo?.BuyerName || 'Amazon Buyer',
    subject: productNames || `Order ${order.AmazonOrderId}`,
    snippet: `${order.OrderStatus} - ${orderTotal.toFixed(2)} ${currency}`,
    lastMessageAt: order.LastUpdateDate || order.PurchaseDate,
    unread: order.OrderStatus === 'Unshipped',
    messagesCount: 1,
    orderTotal: orderTotal,
    orderCurrency: currency,
  };
}

// Parse order to message format
export function orderToMessage(order) {
  return {
    id: `${order.AmazonOrderId}-initial`,
    sender: 'buyer',
    subject: `Order ${order.AmazonOrderId}`,
    bodyText: `Order placed: ${order.OrderStatus}\nTotal: ${order.OrderTotal?.Amount || 'N/A'} ${order.OrderTotal?.CurrencyCode || ''}\nShipping: ${order.ShipmentServiceLevelCategory || 'Standard'}`,
    sentAt: order.PurchaseDate,
    isOutgoing: false,
  };
}
