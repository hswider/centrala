/**
 * Courier Integration Module
 *
 * Common interface for all courier services (DHL, InPost, UPS)
 */

import { sql } from '@vercel/postgres';

// Get courier credentials from database
export async function getCourierCredentials(courier) {
  const { rows } = await sql`
    SELECT * FROM courier_credentials WHERE courier = ${courier}
  `;

  if (rows.length === 0) {
    throw new Error(`Brak konfiguracji dla kuriera: ${courier}`);
  }

  const creds = rows[0];
  if (!creds.api_key) {
    throw new Error(`Brak klucza API dla kuriera: ${courier}`);
  }

  return creds;
}

// Save shipment to database
export async function saveShipment(shipmentData) {
  const {
    order_id,
    courier,
    tracking_number,
    label_url,
    label_data,
    status,
    status_description,
    receiver_name,
    receiver_address,
    receiver_city,
    receiver_postal_code,
    receiver_country,
    receiver_phone,
    receiver_email,
    weight,
    dimensions,
    service_type,
    courier_shipment_id
  } = shipmentData;

  const { rows } = await sql`
    INSERT INTO shipments (
      order_id, courier, tracking_number, label_url, label_data,
      status, status_description,
      receiver_name, receiver_address, receiver_city, receiver_postal_code,
      receiver_country, receiver_phone, receiver_email,
      weight, dimensions, service_type, courier_shipment_id
    ) VALUES (
      ${order_id}, ${courier}, ${tracking_number}, ${label_url}, ${label_data},
      ${status || 'created'}, ${status_description},
      ${receiver_name}, ${receiver_address}, ${receiver_city}, ${receiver_postal_code},
      ${receiver_country || 'PL'}, ${receiver_phone}, ${receiver_email},
      ${weight}, ${JSON.stringify(dimensions || {})}::jsonb, ${service_type}, ${courier_shipment_id}
    )
    RETURNING *
  `;

  return rows[0];
}

// Update shipment status
export async function updateShipmentStatus(id, status, statusDescription) {
  await sql`
    UPDATE shipments
    SET status = ${status},
        status_description = ${statusDescription},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `;
}

// Get shipment by order ID
export async function getShipmentByOrderId(orderId) {
  const { rows } = await sql`
    SELECT * FROM shipments WHERE order_id = ${orderId}
    ORDER BY created_at DESC LIMIT 1
  `;
  return rows[0] || null;
}

// Get shipment by tracking number
export async function getShipmentByTracking(trackingNumber) {
  const { rows } = await sql`
    SELECT * FROM shipments WHERE tracking_number = ${trackingNumber}
  `;
  return rows[0] || null;
}

// Get all shipments (with optional filters)
export async function getShipments(filters = {}) {
  const { courier, status, limit = 100, offset = 0 } = filters;

  let query = 'SELECT * FROM shipments WHERE 1=1';
  const params = [];

  if (courier) {
    params.push(courier);
    query += ` AND courier = $${params.length}`;
  }

  if (status) {
    params.push(status);
    query += ` AND status = $${params.length}`;
  }

  query += ' ORDER BY created_at DESC';
  params.push(limit);
  query += ` LIMIT $${params.length}`;
  params.push(offset);
  query += ` OFFSET $${params.length}`;

  // Use raw query since we have dynamic conditions
  const { rows } = await sql.query(query, params);
  return rows;
}

// Get courier rules for automatic assignment
export async function getCourierRules() {
  const { rows } = await sql`
    SELECT * FROM courier_rules
    WHERE is_active = true
    ORDER BY priority DESC
  `;
  return rows;
}

// Find matching rule for an order
export async function findMatchingRule(order) {
  const rules = await getCourierRules();

  const channel = order.channel_label || order.channelLabel || '';
  const country = order.shipping?.country || order.customer?.country || 'PL';
  const weight = order.weight || 1; // Default weight if not specified

  for (const rule of rules) {
    // Check channel pattern
    if (rule.channel_pattern) {
      const pattern = new RegExp(rule.channel_pattern, 'i');
      if (!pattern.test(channel)) continue;
    }

    // Check country codes
    if (rule.country_codes && rule.country_codes.length > 0) {
      if (!rule.country_codes.includes(country)) continue;
    }

    // Check weight range
    if (rule.min_weight && weight < rule.min_weight) continue;
    if (rule.max_weight && weight > rule.max_weight) continue;

    // All conditions passed - return this rule
    return rule;
  }

  return null; // No matching rule
}

// Common shipment data structure
export function createShipmentPayload(order, options = {}) {
  const shipping = order.shipping || order.customer || {};

  return {
    order_id: order.id,
    receiver: {
      name: shipping.name || `${shipping.firstName || ''} ${shipping.lastName || ''}`.trim(),
      company: shipping.companyName || shipping.company || '',
      street: shipping.street || shipping.address || '',
      city: shipping.city || '',
      postal_code: shipping.zipCode || shipping.postalCode || '',
      country: shipping.country || 'PL',
      phone: shipping.phone || '',
      email: shipping.email || ''
    },
    parcels: [{
      weight: options.weight || 1,
      dimensions: options.dimensions || { length: 30, width: 20, height: 10 }
    }],
    service_type: options.service_type,
    reference: order.externalId || order.id,
    ...options
  };
}

// Supported couriers
export const COURIERS = {
  INPOST: 'inpost',
  DHL_PARCEL: 'dhl_parcel',
  DHL_EXPRESS: 'dhl_express',
  UPS: 'ups'
};

// Courier display names
export const COURIER_NAMES = {
  inpost: 'InPost',
  dhl_parcel: 'DHL Parcel',
  dhl_express: 'DHL Express',
  ups: 'UPS'
};
