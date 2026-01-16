// Kaufland Marketplace Seller API Integration
// Uses HMAC-SHA256 authentication

import crypto from 'crypto';

const KAUFLAND_API_BASE = 'https://sellerapi.kaufland.com/v2';

// Storefront IDs for different Kaufland marketplaces
export const KAUFLAND_STOREFRONTS = {
  DE: 1,   // kaufland.de
  SK: 2,   // kaufland.sk
  CZ: 3,   // kaufland.cz
  PL: 4,   // kaufland.pl (not active yet but reserved)
  AT: 5,   // kaufland.at
  FR: 6,   // kaufland.fr
};

// Reverse mapping for display
export const STOREFRONT_TO_COUNTRY = {
  1: 'DE',
  2: 'SK',
  3: 'CZ',
  4: 'PL',
  5: 'AT',
  6: 'FR',
};

// Generate HMAC-SHA256 signature for Kaufland API
function generateSignature(method, uri, body, timestamp, secretKey) {
  const stringToSign = [
    method,
    uri,
    body,
    timestamp.toString(),
  ].join("\n");

  return crypto
    .createHmac('sha256', secretKey)
    .update(stringToSign)
    .digest('hex');
}

// Make authenticated request to Kaufland API
async function kauflandRequest(method, endpoint, body = '') {
  const clientKey = process.env.KAUFLAND_CLIENT_KEY;
  const secretKey = process.env.KAUFLAND_SECRET_KEY;

  if (!clientKey || !secretKey) {
    throw new Error('Kaufland API credentials not configured');
  }

  const uri = `${KAUFLAND_API_BASE}${endpoint}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const bodyString = body ? JSON.stringify(body) : '';

  const signature = generateSignature(method, uri, bodyString, timestamp, secretKey);

  const headers = {
    'Accept': 'application/json',
    'Shop-Client-Key': clientKey,
    'Shop-Timestamp': timestamp.toString(),
    'Shop-Signature': signature,
  };

  if (method === 'POST' || method === 'PATCH') {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(uri, {
    method,
    headers,
    body: bodyString || undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Kaufland API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// Check if Kaufland API is authenticated
export async function isAuthenticated() {
  try {
    const clientKey = process.env.KAUFLAND_CLIENT_KEY;
    const secretKey = process.env.KAUFLAND_SECRET_KEY;
    return !!(clientKey && secretKey);
  } catch (e) {
    return false;
  }
}

// Get tickets list
// status: 'opened', 'buyer_closed', 'seller_closed', 'both_closed', 'customer_service_closed_final'
// storefronts: array of storefront IDs or null for all
export async function getTickets(status = 'opened', storefronts = null, limit = 30, offset = 0) {
  let endpoint = `/tickets?status=${status}&limit=${limit}&offset=${offset}`;

  if (storefronts && storefronts.length > 0) {
    endpoint += `&storefront=${storefronts.join(',')}`;
  }

  return kauflandRequest('GET', endpoint);
}

// Get single ticket with messages
export async function getTicket(ticketId) {
  return kauflandRequest('GET', `/tickets/${ticketId}`);
}

// Get ticket messages - use /tickets/messages endpoint with filter
export async function getTicketMessages(ticketId) {
  return kauflandRequest('GET', `/tickets/messages?id_ticket=${ticketId}&limit=30`);
}

// Get all recent messages (for sync)
export async function getAllMessages(limit = 30, offset = 0) {
  return kauflandRequest('GET', `/tickets/messages?limit=${limit}&offset=${offset}`);
}

// Send message to ticket
export async function sendTicketMessage(ticketId, text, interimNotice = false) {
  const body = {
    text: text,
  };

  if (interimNotice) {
    body.interim_notice = true;
  }

  return kauflandRequest('POST', `/tickets/${ticketId}/messages`, body);
}

// Close ticket
export async function closeTicket(ticketId) {
  return kauflandRequest('PATCH', `/tickets/${ticketId}/close`);
}

// Open new ticket
export async function openTicket(orderUnitIds, reason, message = null) {
  const body = {
    id_order_unit: orderUnitIds,
    reason: reason, // product_not_as_described, product_defect, product_not_delivered, product_return, contact_other
  };

  if (message) {
    body.message = message;
  }

  return kauflandRequest('POST', '/tickets', body);
}

// Get order details
export async function getOrder(orderId) {
  return kauflandRequest('GET', `/orders/${orderId}`);
}

// Get order unit details
export async function getOrderUnit(orderUnitId) {
  return kauflandRequest('GET', `/order-units/${orderUnitId}`);
}

// Normalize ticket ID - Kaufland sometimes returns IDs with leading zeros
function normalizeTicketId(id) {
  if (!id) return null;
  // Convert to string and keep as-is (don't strip zeros - they're part of the ID)
  return String(id);
}

// Parse ticket to extract useful info
export function parseTicket(ticket) {
  // Determine marketplace from storefront
  const storefront = ticket.storefront || ticket.id_storefront;
  const marketplace = STOREFRONT_TO_COUNTRY[storefront] || 'EU';

  // Extract order info
  const orderUnits = ticket.order_units || [];
  const firstOrderUnit = orderUnits[0] || {};
  const orderId = firstOrderUnit.id_order || ticket.id_order || null;

  // Get buyer info if available
  const buyer = ticket.buyer || {};

  return {
    id: normalizeTicketId(ticket.id_ticket),
    ticketNumber: ticket.ts_ticket_number || ticket.id_ticket,
    status: ticket.status,
    reason: ticket.reason,
    marketplace: marketplace,
    storefront: storefront,
    orderId: orderId,
    orderUnits: orderUnits,
    buyerName: buyer.name || null,
    buyerEmail: buyer.email || null,
    isSellerResponsible: ticket.is_seller_responsible,
    openedAt: ticket.ts_created_iso || ticket.ts_created,
    updatedAt: ticket.ts_updated_iso || ticket.ts_updated,
    topic: ticket.topic || null,
  };
}

// Parse ticket message
export function parseTicketMessage(message) {
  const author = message.author || {};
  const role = author.role || message.sender || 'unknown';

  return {
    id: String(message.id_ticket_message),
    ticketId: normalizeTicketId(message.id_ticket),
    sender: role, // 'seller', 'buyer', 'kaufland'
    senderName: author.name || null,
    text: message.text,
    createdAt: message.ts_created_iso || message.ts_created,
    isFromSeller: role === 'seller',
    files: message.files || [],
  };
}
