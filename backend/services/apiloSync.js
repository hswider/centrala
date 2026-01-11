import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiloClient } from './apiloAuth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ORDERS_PATH = path.join(__dirname, '../data/orders.json');

// Cache for maps
let platformMap = {};
let paymentMap = {};

async function loadMaps() {
  try {
    const [platformRes, paymentRes] = await Promise.all([
      apiloClient.get('/rest/api/orders/platform/map/'),
      apiloClient.get('/rest/api/orders/payment/map/')
    ]);
    platformMap = platformRes.data || {};
    paymentMap = paymentRes.data || {};
    console.log('[Sync] Maps loaded:', Object.keys(platformMap).length, 'platforms,', Object.keys(paymentMap).length, 'payments');
  } catch (error) {
    console.error('[Sync] Failed to load maps:', error.message);
  }
}

function mapOrderToDTO(order) {
  // Map order items
  const items = (order.orderItems || []).map(item => ({
    name: item.originalName || 'Unknown',
    sku: item.sku || '',
    quantity: item.quantity || 1,
    priceGross: parseFloat(item.originalPriceWithTax) || 0,
    totalGross: (parseFloat(item.originalPriceWithTax) || 0) * (item.quantity || 1),
    image: item.media || null,
    isShipping: item.type === 2
  }));

  // Calculate totals from items
  const totalGross = items.reduce((sum, item) => sum + item.totalGross, 0);

  // Get platform name
  const platformId = order.platformAccountId || order.platformId;
  const platformInfo = platformMap[platformId] || {};

  return {
    id: String(order.id),
    externalId: order.idExternal || null,
    channel: {
      label: platformInfo.name || `Platform ${platformId}`,
      platform: platformInfo.platform || 'Unknown'
    },
    dates: {
      orderedAt: order.orderedAt || order.createdAt || null,
      updatedAt: order.updatedAt || null,
      shippingDate: order.shippingDate || null
    },
    status: {
      // paymentStatus: 0=no payment, 1=partial, 2=full, 3=overpayment
      paymentStatus: order.paymentStatus >= 2 ? 'PAID' : 'UNPAID',
      deliveryStatus: order.status || null
    },
    financials: {
      totalGross: totalGross,
      currency: order.originalCurrency || 'PLN',
      paidAmount: order.paymentStatus >= 2 ? totalGross : 0
    },
    items
  };
}

async function runSync() {
  console.log('[Sync] Starting synchronization...');

  try {
    // Load maps if not cached
    if (Object.keys(platformMap).length === 0) {
      await loadMaps();
    }

    // Get latest 10 orders with items included
    const ordersRes = await apiloClient.get('/rest/api/orders/', {
      params: { limit: 10, sort: 'updatedAtDesc' }
    });

    const orders = ordersRes.data?.orders || [];
    console.log('[Sync] Fetched', orders.length, 'orders');

    if (orders.length === 0) {
      saveOrders([]);
      return [];
    }

    // Map to DTOs (items already included in response)
    const orderDTOs = orders.map(order => mapOrderToDTO(order));

    // Save to file
    saveOrders(orderDTOs);
    console.log('[Sync] Saved', orderDTOs.length, 'orders to file');

    return orderDTOs;
  } catch (error) {
    console.error('[Sync] Synchronization failed:', error.message);
    throw error;
  }
}

function saveOrders(orders) {
  fs.writeFileSync(ORDERS_PATH, JSON.stringify(orders, null, 2));
}

function getOrders() {
  try {
    const data = fs.readFileSync(ORDERS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export { runSync, getOrders, loadMaps };
