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

// Reverse mapping for display (supports both numeric IDs and string codes)
export const STOREFRONT_TO_COUNTRY = {
  // Numeric storefront IDs
  1: 'DE',
  2: 'SK',
  3: 'CZ',
  4: 'PL',
  5: 'AT',
  6: 'FR',
  // String storefront codes (API sometimes returns these)
  'de': 'DE',
  'sk': 'SK',
  'cz': 'CZ',
  'pl': 'PL',
  'at': 'AT',
  'fr': 'FR',
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

// Get single ticket with embedded messages (includes all messages: seller, buyer, system)
export async function getTicketWithMessages(ticketId) {
  return kauflandRequest('GET', `/tickets/${ticketId}?embedded=messages`);
}

// Get ticket messages - use embedded endpoint to get ALL messages (seller, buyer, system)
// Note: /tickets/messages endpoint only returns seller messages, so we use embedded instead
export async function getTicketMessages(ticketId) {
  const response = await getTicketWithMessages(ticketId);
  // Extract messages from embedded response and format like the messages endpoint
  const ticketData = response.data || response;
  const messages = ticketData.messages || [];
  return { data: messages };
}

// Get all recent messages (for sync)
export async function getAllMessages(limit = 30, offset = 0) {
  return kauflandRequest('GET', `/tickets/messages?limit=${limit}&offset=${offset}`);
}

// Send message to ticket (with optional file attachments)
export async function sendTicketMessage(ticketId, text, interimNotice = false, attachments = []) {
  const clientKey = process.env.KAUFLAND_CLIENT_KEY;
  const secretKey = process.env.KAUFLAND_SECRET_KEY;

  if (!clientKey || !secretKey) {
    throw new Error('Kaufland API credentials not configured');
  }

  // If no attachments, use simple JSON request
  if (!attachments || attachments.length === 0) {
    const body = {
      text: text,
    };
    if (interimNotice) {
      body.interim_notice = true;
    }
    return kauflandRequest('POST', `/tickets/${ticketId}/messages`, body);
  }

  // With attachments, use multipart/form-data
  const uri = `${KAUFLAND_API_BASE}/tickets/${ticketId}/messages`;
  const timestamp = Math.floor(Date.now() / 1000);

  // For multipart requests, the body in signature should be empty
  const signature = generateSignature('POST', uri, '', timestamp, secretKey);

  // Create form data
  const FormData = (await import('form-data')).default;
  const formData = new FormData();
  formData.append('text', text);

  if (interimNotice) {
    formData.append('interim_notice', 'true');
  }

  // Add file attachments
  for (let i = 0; i < attachments.length; i++) {
    const att = attachments[i];
    const buffer = Buffer.from(att.data, 'base64');
    formData.append('files[]', buffer, {
      filename: att.filename,
      contentType: att.mimeType,
    });
  }

  const response = await fetch(uri, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Shop-Client-Key': clientKey,
      'Shop-Timestamp': timestamp.toString(),
      'Shop-Signature': signature,
      ...formData.getHeaders(),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Kaufland API error: ${response.status} - ${errorText}`);
  }

  return response.json();
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

  // Convert storefront to integer for database (or null if not a number)
  let storefrontId = null;
  if (typeof storefront === 'number') {
    storefrontId = storefront;
  } else if (typeof storefront === 'string') {
    // Try to convert string codes to IDs
    const storefrontMap = { 'de': 1, 'sk': 2, 'cz': 3, 'pl': 4, 'at': 5, 'fr': 6 };
    storefrontId = storefrontMap[storefront.toLowerCase()] || null;
  }

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
    storefront: storefrontId,
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
// Note: Kaufland returns buyer messages as "system" messages containing the customer's request
export function parseTicketMessage(message) {
  const author = message.author || {};
  let role = author.role || message.sender || 'unknown';
  let senderName = author.name || null;
  const text = message.text || '';

  // System messages that contain buyer requests should be marked as buyer messages
  // These typically start with keywords like "Rücksendung wurde angefragt", "Reklamation", etc.
  // and contain "unser gemeinsamer Kunde" (our shared customer)
  const isBuyerSystemMessage = role === 'system' && (
    text.includes('unser gemeinsamer Kunde') ||
    text.includes('Der Kunde hat folgende Nachricht') ||
    text.includes('Käufer hat eine Nachricht') ||
    text.includes('wurde angefragt')
  );

  // System messages about seller actions (closing ticket, etc.) stay as system
  const isSellerActionMessage = role === 'system' && (
    text.includes('hat die Anfrage geschlossen') ||
    text.includes('Verkäufer hat')
  );

  if (isBuyerSystemMessage && !isSellerActionMessage) {
    role = 'buyer';
    // Try to extract customer name from message
    const customerMatch = text.match(/Kunde\s+([A-Za-zÀ-ÿ]+\s+[A-Za-zÀ-ÿ]+)/);
    if (customerMatch) {
      senderName = customerMatch[1];
    }
  }

  return {
    id: String(message.id_ticket_message),
    ticketId: normalizeTicketId(message.id_ticket),
    sender: role, // 'seller', 'buyer', 'system', 'kaufland'
    senderName: senderName,
    text: text,
    createdAt: message.ts_created_iso || message.ts_created,
    isFromSeller: role === 'seller',
    files: message.files || [],
  };
}
