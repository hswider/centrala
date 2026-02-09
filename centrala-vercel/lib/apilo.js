import axios from 'axios';
import { getTokens, saveTokens } from './db';

const APILO_BASE_URL = process.env.APILO_BASE_URL;
const APILO_CLIENT_ID = process.env.APILO_CLIENT_ID;
const APILO_CLIENT_SECRET = process.env.APILO_CLIENT_SECRET;

// Platform maps cache
let platformMap = {};
let paymentMap = {};

async function refreshTokens(refreshToken) {
  const credentials = Buffer.from(`${APILO_CLIENT_ID}:${APILO_CLIENT_SECRET}`).toString('base64');

  const response = await axios.post(
    `${APILO_BASE_URL}/rest/auth/token/`,
    { grantType: 'refresh_token', token: refreshToken },
    {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }
  );

  const { accessToken, refreshToken: newRefreshToken, accessTokenExpireAt } = response.data;
  const expiresAt = accessTokenExpireAt
    ? new Date(accessTokenExpireAt).getTime() - 60000
    : Date.now() + 3600000;

  await saveTokens(accessToken, newRefreshToken, expiresAt);
  console.log('[Apilo] Tokens refreshed');

  return accessToken;
}

async function getAccessToken() {
  const tokens = await getTokens();

  if (!tokens || !tokens.access_token) {
    throw new Error('No tokens found. Please set initial tokens in database.');
  }

  const expiresAt = parseInt(tokens.expires_at);
  const now = Date.now();

  // Proactive refresh: if token expires in less than 7 days, refresh it now
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const shouldRefreshProactively = expiresAt && (expiresAt - now) < sevenDaysMs;

  // Check if token is still valid
  if (tokens.expires_at && now < expiresAt && !shouldRefreshProactively) {
    return tokens.access_token;
  }

  // Refresh token (either expired or proactive refresh)
  if (tokens.refresh_token) {
    if (shouldRefreshProactively) {
      console.log('[Apilo] Proactive token refresh - expires in', Math.round((expiresAt - now) / (24 * 60 * 60 * 1000)), 'days');
    }
    return await refreshTokens(tokens.refresh_token);
  }

  throw new Error('Cannot refresh token - no refresh token available');
}

async function apiloRequest(method, endpoint, data = null) {
  const token = await getAccessToken();

  const config = {
    method,
    url: `${APILO_BASE_URL}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      const tokens = await getTokens();
      if (tokens?.refresh_token) {
        const newToken = await refreshTokens(tokens.refresh_token);
        config.headers['Authorization'] = `Bearer ${newToken}`;
        const response = await axios(config);
        return response.data;
      }
    }
    throw error;
  }
}

async function loadMaps() {
  if (Object.keys(platformMap).length === 0) {
    try {
      const [platformsArray, paymentsArray] = await Promise.all([
        apiloRequest('GET', '/rest/api/orders/platform/map/'),
        apiloRequest('GET', '/rest/api/orders/payment/map/')
      ]);

      // Convert array to object with id as key
      // platformsArray is [{id: 121, name: "Amazon", description: "Amazon DE Agnieszka"}, ...]
      if (Array.isArray(platformsArray)) {
        platformsArray.forEach(p => {
          platformMap[p.id] = {
            name: p.description || p.name, // Use description as channel name
            platform: p.name // Use name as platform type (Amazon, Allegro, etc.)
          };
        });
      }

      if (Array.isArray(paymentsArray)) {
        paymentsArray.forEach(p => {
          paymentMap[p.id] = p.name || p.description;
        });
      }

      console.log('[Apilo] Maps loaded:', Object.keys(platformMap).length, 'platforms');
    } catch (error) {
      console.error('[Apilo] Failed to load maps:', error.message);
    }
  }
}

function mapAddressToDTO(address) {
  if (!address) return null;
  return {
    name: address.name || '',
    phone: address.phone || '',
    email: address.email || '',
    street: address.streetName || '',
    streetNumber: address.streetNumber || '',
    city: address.city || '',
    zipCode: address.zipCode || '',
    country: address.country || '',
    companyName: address.companyName || '',
    companyTaxNumber: address.companyTaxNumber || ''
  };
}

function mapOrderToDTO(order) {
  // Map order items - include ALL items regardless of image
  const items = (order.orderItems || []).map(item => ({
    name: item.originalName || 'Unknown',
    sku: item.sku || '',
    ean: item.ean || '',
    quantity: item.quantity || 1,
    priceGross: parseFloat(item.originalPriceWithTax) || 0,
    priceNet: parseFloat(item.originalPriceWithoutTax) || 0,
    totalGross: (parseFloat(item.originalPriceWithTax) || 0) * (item.quantity || 1),
    image: item.media || null,
    isShipping: item.type === 2,
    tax: item.tax || null
  }));

  const totalGross = parseFloat(order.originalAmountTotalWithTax) || items.reduce((sum, item) => sum + item.totalGross, 0);
  const totalNet = parseFloat(order.originalAmountTotalWithoutTax) || 0;
  const paidAmount = parseFloat(order.originalAmountTotalPaid) || 0;

  const platformId = order.platformAccountId || order.platformId;
  const platformInfo = platformMap[platformId] || {};

  // Get platform name from multiple sources
  let platformName = 'Unknown';
  let channelLabel = platformInfo.name || `Platform ${platformId}`;

  if (order.extendedProperties && order.extendedProperties.platformName) {
    platformName = order.extendedProperties.platformName;
    channelLabel = order.extendedProperties.platformName;
  } else if (platformInfo.platform) {
    platformName = platformInfo.platform;
  } else if (platformInfo.name) {
    platformName = platformInfo.name.split(' - ')[0] || platformInfo.name;
  }

  // Map payments
  const payments = (order.orderPayments || []).map(p => ({
    id: p.id,
    date: p.paymentDate || null,
    amount: parseFloat(p.amount) || 0,
    currency: p.currency || order.originalCurrency || 'PLN',
    type: paymentMap[p.type] || `Typ ${p.type}`,
    comment: p.comment || ''
  }));

  // Map notes
  const notes = (order.orderNotes || []).map(n => ({
    type: n.type,
    comment: n.comment || '',
    createdAt: n.createdAt
  }));

  return {
    id: String(order.id),
    externalId: order.idExternal || null,
    externalId2: order.preferences?.idUser || null,
    channel: {
      label: channelLabel,
      platform: platformName
    },
    dates: {
      orderedAt: order.orderedAt || order.createdAt || null,
      updatedAt: order.updatedAt || null,
      shippingDate: order.shippingDate || null,
      sendDateMin: order.sendDateMin || null,
      sendDateMax: order.sendDateMax || null
    },
    status: {
      paymentStatus: order.paymentStatus >= 2 ? 'PAID' : 'UNPAID',
      paymentStatusCode: order.paymentStatus,
      deliveryStatus: order.status || null,
      isInvoice: order.isInvoice || false,
      isCanceled: order.isCanceledByBuyer || false
    },
    financials: {
      totalGross,
      totalNet,
      currency: order.originalCurrency || 'PLN',
      paidAmount
    },
    customer: mapAddressToDTO(order.addressCustomer),
    shipping: mapAddressToDTO(order.addressDelivery),
    invoice: mapAddressToDTO(order.addressInvoice),
    payments,
    notes,
    items,
    carrierId: order.carrierId
  };
}

export async function fetchOrders(limit = 100, offset = 0) {
  await loadMaps();

  // Fetch orders with larger limit
  const data = await apiloRequest('GET', `/rest/api/orders/?limit=${limit}&offset=${offset}&sort=updatedAtDesc`);
  const orders = data?.orders || [];

  console.log('[Apilo] Fetched', orders.length, 'orders (offset:', offset, ')');

  return orders.map(order => mapOrderToDTO(order));
}

// Fetch send dates for a single order
export async function fetchOrderSendDates(orderId) {
  try {
    const order = await apiloRequest('GET', `/rest/api/orders/${orderId}/`);
    return {
      sendDateMin: order.sendDateMin || null,
      sendDateMax: order.sendDateMax || null
    };
  } catch (error) {
    console.error(`[Apilo] Failed to fetch send dates for ${orderId}:`, error.message);
    return null;
  }
}

// Fetch orders from a specific date range (for historical sync)
export async function fetchOrdersFromDateRange(fromDate, maxOrders = 5000) {
  await loadMaps();

  let allOrders = [];
  let offset = 0;
  const limit = 500; // Max allowed by Apilo API
  let hasMore = true;

  const fromDateParam = encodeURIComponent(fromDate.toISOString());

  console.log('[Apilo] Fetching orders from:', fromDate.toISOString());

  while (hasMore) {
    try {
      const url = `/rest/api/orders/?limit=${limit}&offset=${offset}&orderedAfter=${fromDateParam}&sort=orderedAtDesc`;

      const data = await apiloRequest('GET', url);
      const orders = data?.orders || [];

      if (orders.length === 0) {
        hasMore = false;
      } else {
        const mappedOrders = orders.map(order => mapOrderToDTO(order));
        allOrders = allOrders.concat(mappedOrders);
        offset += limit;

        console.log('[Apilo] Fetched', allOrders.length, 'orders so far...');

        // Safety limit
        if (offset >= maxOrders || allOrders.length >= maxOrders) {
          hasMore = false;
        }

        // Small delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 400));
      }
    } catch (error) {
      console.error('[Apilo] Error fetching orders at offset', offset, ':', error.message);
      hasMore = false;
    }
  }

  console.log('[Apilo] Total fetched from date range:', allOrders.length, 'orders');
  return allOrders;
}

export async function fetchAllNewOrders(lastSyncDate = null, maxOrders = 500) {
  await loadMaps();

  let allOrders = [];
  let offset = 0;
  const limit = 500; // Max allowed by Apilo API
  let hasMore = true;

  // First, fetch orders from last 24 hours (catches all recent orders)
  const oneDayAgo = new Date();
  oneDayAgo.setHours(oneDayAgo.getHours() - 24);
  const oneDayAgoParam = encodeURIComponent(oneDayAgo.toISOString());

  try {
    // Fetch orders ordered in last 24 hours
    const recentOrderedUrl = `/rest/api/orders/?limit=500&orderedAfter=${oneDayAgoParam}&sort=orderedAtDesc`;
    const recentOrderedData = await apiloRequest('GET', recentOrderedUrl);
    const recentOrderedOrders = recentOrderedData?.orders || [];
    if (recentOrderedOrders.length > 0) {
      console.log('[Apilo] Fetched', recentOrderedOrders.length, 'orders from last 24h (orderedAfter)');
      allOrders = recentOrderedOrders.map(order => mapOrderToDTO(order));
    }
  } catch (error) {
    console.error('[Apilo] Failed to fetch recent ordered:', error.message);
  }

  // Also fetch recently updated orders (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoParam = encodeURIComponent(weekAgo.toISOString());

  try {
    const recentUrl = `/rest/api/orders/?limit=500&updatedAfter=${weekAgoParam}`;
    const recentData = await apiloRequest('GET', recentUrl);
    const recentOrders = recentData?.orders || [];
    if (recentOrders.length > 0) {
      console.log('[Apilo] Fetched', recentOrders.length, 'recent orders (updatedAfter)');
      // Add only orders that aren't already fetched
      const existingIds = new Set(allOrders.map(o => o.id));
      const newOrders = recentOrders
        .map(order => mapOrderToDTO(order))
        .filter(o => !existingIds.has(o.id));
      allOrders = allOrders.concat(newOrders);
    }
  } catch (error) {
    console.error('[Apilo] Failed to fetch recent orders:', error.message);
  }

  // Then fetch orders from the main list (sorted by updatedAt, not orderedAt)
  while (hasMore) {
    let url = `/rest/api/orders/?limit=${limit}&offset=${offset}&sort=updatedAtDesc`;

    const data = await apiloRequest('GET', url);
    const orders = data?.orders || [];

    if (orders.length === 0) {
      hasMore = false;
    } else {
      // Add only orders that aren't already in allOrders (avoid duplicates)
      const existingIds = new Set(allOrders.map(o => o.id));
      const newMappedOrders = orders
        .map(order => mapOrderToDTO(order))
        .filter(o => !existingIds.has(o.id));

      allOrders = allOrders.concat(newMappedOrders);
      offset += limit;

      // Safety limit to prevent infinite loops
      if (offset >= maxOrders) {
        hasMore = false;
      }

      // Small delay to respect API rate limits (150 req/min)
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log('[Apilo] Total fetched:', allOrders.length, 'orders');
  return allOrders;
}

// ==================== SHIPPING / COURIER API ====================

// Get list of available carriers
export async function getCarriers() {
  const data = await apiloRequest('GET', '/rest/api/orders/carrier/map/');
  return data || [];
}

// Get carrier accounts (configured courier integrations)
export async function getCarrierAccounts() {
  const data = await apiloRequest('GET', '/rest/api/shipping/carrier-account/');
  return data || [];
}

// Get shipping methods for a carrier account
export async function getShippingMethods(carrierAccountId) {
  const data = await apiloRequest('GET', `/rest/api/shipping/carrier-account/${carrierAccountId}/method/`);
  return data || [];
}

// Get shipping method options/map
export async function getShippingMethodOptions(carrierAccountId, methodUuid) {
  const data = await apiloRequest('GET', `/rest/api/shipping/carrier-account/${carrierAccountId}/method/${methodUuid}/map/`);
  return data || {};
}

// Create shipment through Apilo (using Apilo's courier integration)
export async function createShipment(shipmentData) {
  /*
    shipmentData: {
      carrierAccountId: number,        // ID konta kuriera w Apilo
      orderId: string,                 // ID zamówienia
      method: string,                  // UUID metody wysyłki
      addressReceiver: {
        type: 'house' | 'apartment',
        name: string,
        streetName: string,
        streetNumber: string,
        zipCode: string,
        city: string,
        country: string,               // 'PL'
        phone: string,
        email: string
      },
      parcels: [{
        weight: number,                // waga w gramach
        dimensions: { length, width, height }  // wymiary w cm
      }],
      options: [{                      // opcje kuriera
        id: string,
        type: string,
        value: any
      }],
      postDate?: string                // data wysyłki ISO 8601
    }
  */

  const payload = {
    carrierAccountId: shipmentData.carrierAccountId,
    orderId: shipmentData.orderId,
    method: shipmentData.method,
    postDate: shipmentData.postDate || new Date().toISOString(),
    addressReceiver: shipmentData.addressReceiver,
    parcels: shipmentData.parcels.map(p => ({
      options: [
        {
          id: 'dimensions',
          type: 'dimensions',
          value: {
            length: p.dimensions?.length || 30,
            width: p.dimensions?.width || 20,
            height: p.dimensions?.height || 10
          }
        },
        {
          id: 'weight',
          type: 'integer',
          value: Math.round((p.weight || 1) * 1000) // kg -> g
        }
      ]
    })),
    options: shipmentData.options || []
  };

  const result = await apiloRequest('POST', '/rest/api/shipping/shipment/', payload);
  return result;
}

// Notify Apilo about shipment created externally (outside Apilo)
export async function notifyShipmentCreated(orderId, shipmentInfo) {
  /*
    shipmentInfo: {
      idExternal: string,              // zewnętrzny numer przesyłki
      tracking: string,                // numer śledzenia
      carrierProviderId: number,       // ID kuriera (z carrier/map, isBroker: false)
      postDate?: string,               // data wysyłki ISO 8601
      media?: string                   // UUID pliku z etykietą
    }
  */

  const payload = {
    idExternal: shipmentInfo.idExternal,
    tracking: shipmentInfo.tracking,
    carrierProviderId: shipmentInfo.carrierProviderId,
    postDate: shipmentInfo.postDate || new Date().toISOString(),
    ...(shipmentInfo.media && { media: shipmentInfo.media })
  };

  const result = await apiloRequest('POST', `/rest/api/orders/${orderId}/shipment/`, payload);
  return result;
}

// Get shipment details for an order
export async function getOrderShipments(orderId) {
  const order = await apiloRequest('GET', `/rest/api/orders/${orderId}/`);
  return order?.shipments || [];
}

// Upload file (for label) and get UUID
export async function uploadFile(base64Data, filename, mimeType = 'application/pdf') {
  // Apilo uses media upload endpoint
  const payload = {
    name: filename,
    content: base64Data,
    mimeType: mimeType
  };

  const result = await apiloRequest('POST', '/rest/api/media/', payload);
  return result?.uuid || result?.id;
}

// Update order status
export async function updateOrderStatus(orderId, status) {
  const payload = {
    status: status
  };

  const result = await apiloRequest('PATCH', `/rest/api/orders/${orderId}/`, payload);
  return result;
}

// Get shipment label from Apilo (if available)
export async function getShipmentLabel(shipmentId) {
  try {
    const data = await apiloRequest('GET', `/rest/api/shipping/shipment/${shipmentId}/label/`);
    return data;
  } catch (error) {
    console.error('[Apilo] Failed to get label:', error.message);
    return null;
  }
}
