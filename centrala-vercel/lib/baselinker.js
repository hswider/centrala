// Baselinker API Integration
// Uses X-BLToken header for authentication

const BASELINKER_API_URL = 'https://api.baselinker.com/connector.php';

// Cache for order statuses
let statusesCache = {};

async function baselinkerRequest(method, parameters = {}) {
  const apiKey = process.env.BASELINKER_API_KEY;

  if (!apiKey) {
    throw new Error('BASELINKER_API_KEY not configured');
  }

  const formData = new URLSearchParams();
  formData.append('method', method);
  formData.append('parameters', JSON.stringify(parameters));

  const response = await fetch(BASELINKER_API_URL, {
    method: 'POST',
    headers: {
      'X-BLToken': apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    throw new Error(`Baselinker API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.status === 'ERROR') {
    throw new Error(`Baselinker API error: ${data.error_code} - ${data.error_message}`);
  }

  return data;
}

// Load order statuses from Baselinker
async function loadStatuses() {
  if (Object.keys(statusesCache).length === 0) {
    try {
      const data = await baselinkerRequest('getOrderStatusList');
      if (data.statuses) {
        data.statuses.forEach(status => {
          statusesCache[status.id] = status.name;
        });
      }
      console.log('[Baselinker] Loaded', Object.keys(statusesCache).length, 'statuses');
    } catch (error) {
      console.error('[Baselinker] Failed to load statuses:', error.message);
    }
  }
  return statusesCache;
}

// Get order sources (shops/marketplaces)
export async function getOrderSources() {
  const data = await baselinkerRequest('getOrderSources');
  return data.sources || {};
}

// Map Baselinker order to common DTO format (same as Apilo)
function mapOrderToDTO(order, statuses = {}) {
  // Map products
  const items = (order.products || []).map(product => ({
    name: product.name || 'Unknown',
    sku: product.sku || '',
    ean: product.ean || '',
    quantity: product.quantity || 1,
    priceGross: parseFloat(product.price_brutto) || 0,
    priceNet: parseFloat(product.price_netto) || 0,
    totalGross: (parseFloat(product.price_brutto) || 0) * (product.quantity || 1),
    image: product.variant_id ? null : null, // Baselinker doesn't return images in getOrders
    isShipping: false,
    tax: product.tax_rate || null
  }));

  // Calculate totals
  const totalGross = parseFloat(order.payment_done) || items.reduce((sum, item) => sum + item.totalGross, 0);

  // Get status name
  const statusName = statuses[order.order_status_id] || `Status ${order.order_status_id}`;

  // Determine platform from order_source
  let platformName = 'Baselinker';
  let channelLabel = order.order_source || 'Baselinker';

  if (order.order_source) {
    // Try to extract platform name (e.g., "allegro", "amazon", "ebay")
    const source = order.order_source.toLowerCase();
    if (source.includes('allegro')) platformName = 'Allegro';
    else if (source.includes('amazon')) platformName = 'Amazon';
    else if (source.includes('ebay')) platformName = 'eBay';
    else if (source.includes('erli')) platformName = 'Erli';
    else if (source.includes('empik')) platformName = 'Empik';
    else if (source.includes('otto')) platformName = 'OTTO';
    else if (source.includes('shopify') || source === 'shop') platformName = 'Shopify';
    else if (source.includes('woocommerce')) platformName = 'WooCommerce';
    else if (source.includes('prestashop')) platformName = 'PrestaShop';
    else platformName = order.order_source;

    // Custom channel labels for specific stores
    if (source.includes('otto')) {
      channelLabel = 'Gutekissen OTTO';
    } else if (source.includes('shopify') || source === 'shop') {
      channelLabel = 'Gutekissen';
    } else {
      channelLabel = order.order_source;
    }
  }

  // Delivery address
  const shipping = {
    name: order.delivery_fullname || '',
    phone: order.delivery_phone || order.phone || '',
    email: order.email || '',
    street: order.delivery_address || '',
    streetNumber: '',
    city: order.delivery_city || '',
    zipCode: order.delivery_postcode || '',
    country: order.delivery_country_code || order.delivery_country || '',
    companyName: order.delivery_company || '',
    companyTaxNumber: ''
  };

  // Invoice address
  const invoice = order.invoice_fullname ? {
    name: order.invoice_fullname || '',
    phone: order.phone || '',
    email: order.email || '',
    street: order.invoice_address || '',
    streetNumber: '',
    city: order.invoice_city || '',
    zipCode: order.invoice_postcode || '',
    country: order.invoice_country_code || order.invoice_country || '',
    companyName: order.invoice_company || '',
    companyTaxNumber: order.invoice_nip || ''
  } : null;

  // Customer info
  const customer = {
    name: order.delivery_fullname || order.invoice_fullname || '',
    phone: order.phone || order.delivery_phone || '',
    email: order.email || '',
    street: order.delivery_address || '',
    streetNumber: '',
    city: order.delivery_city || '',
    zipCode: order.delivery_postcode || '',
    country: order.delivery_country_code || '',
    companyName: order.delivery_company || '',
    companyTaxNumber: order.invoice_nip || ''
  };

  // Payment info
  const payments = [];
  if (order.payment_done > 0) {
    payments.push({
      id: order.order_id,
      date: order.date_confirmed ? new Date(order.date_confirmed * 1000).toISOString() : null,
      amount: parseFloat(order.payment_done) || 0,
      currency: order.currency || 'PLN',
      type: order.payment_method || 'Unknown',
      comment: ''
    });
  }

  // Notes
  const notes = [];
  if (order.user_comments) {
    notes.push({
      type: 1,
      comment: order.user_comments,
      createdAt: order.date_add ? new Date(order.date_add * 1000).toISOString() : null
    });
  }
  if (order.admin_comments) {
    notes.push({
      type: 2,
      comment: order.admin_comments,
      createdAt: null
    });
  }

  return {
    id: `BL-${order.order_id}`, // Prefix with BL to distinguish from Apilo orders
    externalId: order.shop_order_id || order.external_order_id || null,
    externalId2: order.user_login || null,
    channel: {
      label: channelLabel,
      platform: platformName
    },
    dates: {
      orderedAt: order.date_add ? new Date(order.date_add * 1000).toISOString() : null,
      updatedAt: order.date_in_status ? new Date(order.date_in_status * 1000).toISOString() : null,
      shippingDate: null,
      sendDateMin: null,
      sendDateMax: null
    },
    status: {
      paymentStatus: order.payment_done > 0 ? 'PAID' : 'UNPAID',
      paymentStatusCode: order.payment_done > 0 ? 2 : 0,
      deliveryStatus: order.order_status_id,
      deliveryStatusName: statusName,
      isInvoice: order.want_invoice === '1' || order.want_invoice === 1,
      isCanceled: false
    },
    financials: {
      totalGross,
      totalNet: totalGross / 1.23, // Approximate if not provided
      currency: order.currency || 'PLN',
      paidAmount: parseFloat(order.payment_done) || 0
    },
    customer,
    shipping,
    invoice,
    payments,
    notes,
    items,
    carrierId: order.delivery_method || null,
    source: 'baselinker' // Mark the source
  };
}

// Fetch orders from Baselinker
export async function fetchOrders(limit = 100, dateFrom = null) {
  await loadStatuses();

  const parameters = {
    get_unconfirmed_orders: true, // Include all orders
  };

  if (dateFrom) {
    // Use date_from (order creation date) instead of date_confirmed_from
    parameters.date_from = Math.floor(dateFrom.getTime() / 1000);
  }

  const data = await baselinkerRequest('getOrders', parameters);
  const orders = data.orders || [];

  console.log('[Baselinker] Fetched', orders.length, 'orders');

  return orders.map(order => mapOrderToDTO(order, statusesCache));
}

// Fetch all orders with pagination (for sync)
export async function fetchAllNewOrders(lastSyncDate = null, maxOrders = 500) {
  await loadStatuses();

  let allOrders = [];
  let lastOrderId = null;
  let hasMore = true;

  // Calculate date_from - last 30 days if no sync date, or from last sync
  const dateFrom = lastSyncDate
    ? new Date(lastSyncDate)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  console.log('[Baselinker] Fetching orders from:', dateFrom.toISOString());

  while (hasMore && allOrders.length < maxOrders) {
    const parameters = {
      get_unconfirmed_orders: true, // Include all orders
      date_from: Math.floor(dateFrom.getTime() / 1000), // Use date_from instead of date_confirmed_from
    };

    if (lastOrderId) {
      parameters.id_from = lastOrderId;
    }

    try {
      console.log('[Baselinker] Request params:', JSON.stringify(parameters));
      const data = await baselinkerRequest('getOrders', parameters);
      console.log('[Baselinker] Response status:', data.status);
      const orders = data.orders || [];

      if (orders.length === 0) {
        hasMore = false;
        console.log('[Baselinker] No more orders found');
      } else {
        const mappedOrders = orders.map(order => mapOrderToDTO(order, statusesCache));
        allOrders = allOrders.concat(mappedOrders);

        // Get last order ID for pagination
        lastOrderId = orders[orders.length - 1].order_id;

        console.log('[Baselinker] Fetched', allOrders.length, 'orders so far...');

        // Check if we got less than 100 orders (API returns max 100)
        if (orders.length < 100) {
          hasMore = false;
        }

        // Small delay to respect API rate limits (100 req/min)
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    } catch (error) {
      console.error('[Baselinker] Error fetching orders:', error.message, error.stack);
      hasMore = false;
    }
  }

  console.log('[Baselinker] Total fetched:', allOrders.length, 'orders');
  return allOrders;
}

// Check if Baselinker is configured
export function isConfigured() {
  return !!process.env.BASELINKER_API_KEY;
}

// Get order statuses
export async function getOrderStatuses() {
  const data = await baselinkerRequest('getOrderStatusList');
  return data.statuses || [];
}
