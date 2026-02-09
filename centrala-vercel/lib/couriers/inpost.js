/**
 * InPost ShipX API Integration
 *
 * Documentation: https://docs.inpost24.com/
 */

import { getCourierCredentials, saveShipment } from './index';

const SANDBOX_URL = 'https://sandbox-api-shipx-pl.easypack24.net/v1';
const PRODUCTION_URL = 'https://api-shipx-pl.easypack24.net/v1';

// Get base URL based on environment
function getBaseUrl(environment) {
  return environment === 'production' ? PRODUCTION_URL : SANDBOX_URL;
}

// Make authenticated request to InPost API
async function inpostFetch(endpoint, options = {}, creds = null) {
  if (!creds) {
    creds = await getCourierCredentials('inpost');
  }

  const extraConfig = creds.extra_config || {};
  const apiToken = extraConfig.api_token || creds.api_key; // Fallback to old field
  const baseUrl = getBaseUrl(creds.environment);
  const url = `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`InPost API error ${response.status}: ${errorText}`);
  }

  // Some endpoints return empty body (204)
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// Get organization info (useful for testing connection)
export async function getOrganization() {
  return inpostFetch('/organizations');
}

// Get available services
export async function getServices() {
  return inpostFetch('/services');
}

// Create a shipment
export async function createShipment(shipmentData, options = {}) {
  const creds = await getCourierCredentials('inpost');
  const extraConfig = creds.extra_config || {};
  const organizationId = extraConfig.organization_id;

  if (!organizationId) {
    throw new Error('Brak organization_id w konfiguracji InPost');
  }

  const payload = {
    receiver: {
      name: shipmentData.receiver.name,
      company_name: shipmentData.receiver.company || null,
      first_name: shipmentData.receiver.name?.split(' ')[0] || '',
      last_name: shipmentData.receiver.name?.split(' ').slice(1).join(' ') || '',
      email: shipmentData.receiver.email,
      phone: shipmentData.receiver.phone?.replace(/\s/g, '').replace(/^\+48/, '')
    },
    sender: extraConfig.sender || {
      name: 'POOM',
      company_name: extraConfig.company_name || 'POOM',
      email: extraConfig.sender_email || 'kontakt@poom.pl',
      phone: extraConfig.sender_phone || '123456789'
    },
    parcels: shipmentData.parcels.map(p => ({
      dimensions: {
        length: p.dimensions?.length || 30,
        width: p.dimensions?.width || 20,
        height: p.dimensions?.height || 10,
        unit: 'mm'
      },
      weight: {
        amount: p.weight || 1,
        unit: 'kg'
      }
    })),
    service: options.service || 'inpost_courier_standard',
    reference: shipmentData.reference,
    comments: options.comments || '',
    external_customer_id: shipmentData.order_id,
    ...getAddressPayload(shipmentData, options)
  };

  const result = await inpostFetch(
    `/organizations/${organizationId}/shipments`,
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    creds
  );

  // Save to database
  const savedShipment = await saveShipment({
    order_id: shipmentData.order_id,
    courier: 'inpost',
    tracking_number: result.tracking_number,
    status: mapInpostStatus(result.status),
    status_description: result.status,
    receiver_name: shipmentData.receiver.name,
    receiver_address: shipmentData.receiver.street,
    receiver_city: shipmentData.receiver.city,
    receiver_postal_code: shipmentData.receiver.postal_code,
    receiver_country: shipmentData.receiver.country,
    receiver_phone: shipmentData.receiver.phone,
    receiver_email: shipmentData.receiver.email,
    weight: shipmentData.parcels[0]?.weight,
    dimensions: shipmentData.parcels[0]?.dimensions,
    service_type: payload.service,
    courier_shipment_id: result.id?.toString()
  });

  return {
    shipment: savedShipment,
    courier_response: result
  };
}

// Get address payload based on service type
function getAddressPayload(shipmentData, options) {
  // For Paczkomat delivery
  if (options.target_point) {
    return {
      custom_attributes: {
        target_point: options.target_point,
        dropoff_point: options.dropoff_point
      }
    };
  }

  // For courier delivery to address
  return {
    receiver: {
      address: {
        street: shipmentData.receiver.street,
        building_number: extractBuildingNumber(shipmentData.receiver.street),
        city: shipmentData.receiver.city,
        post_code: shipmentData.receiver.postal_code,
        country_code: shipmentData.receiver.country || 'PL'
      }
    }
  };
}

// Extract building number from street address
function extractBuildingNumber(street) {
  if (!street) return '';
  const match = street.match(/\d+[a-zA-Z]?$/);
  return match ? match[0] : '';
}

// Get shipment details
export async function getShipment(shipmentId) {
  return inpostFetch(`/shipments/${shipmentId}`);
}

// Track shipment by tracking number
export async function trackShipment(trackingNumber) {
  return inpostFetch(`/tracking/${trackingNumber}`);
}

// Get shipment label (PDF)
export async function getLabel(shipmentId, format = 'pdf') {
  const creds = await getCourierCredentials('inpost');
  const extraConfig = creds.extra_config || {};
  const apiToken = extraConfig.api_token || creds.api_key;
  const baseUrl = getBaseUrl(creds.environment);

  const response = await fetch(`${baseUrl}/shipments/${shipmentId}/label`, {
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Accept': format === 'pdf' ? 'application/pdf' : 'image/png'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`InPost label error ${response.status}: ${errorText}`);
  }

  const buffer = await response.arrayBuffer();
  return {
    data: Buffer.from(buffer).toString('base64'),
    contentType: format === 'pdf' ? 'application/pdf' : 'image/png'
  };
}

// Create dispatch order (book pickup)
export async function createDispatchOrder(shipmentIds, options = {}) {
  const creds = await getCourierCredentials('inpost');
  const extraConfig = creds.extra_config || {};
  const organizationId = extraConfig.organization_id;

  if (!organizationId) {
    throw new Error('Brak organization_id w konfiguracji InPost');
  }

  const payload = {
    shipments: shipmentIds,
    address: options.pickup_address || extraConfig.pickup_address,
    comment: options.comment || ''
  };

  return inpostFetch(
    `/organizations/${organizationId}/dispatch_orders`,
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    creds
  );
}

// Map InPost status to common status
function mapInpostStatus(inpostStatus) {
  const statusMap = {
    'created': 'created',
    'offers_prepared': 'created',
    'offer_selected': 'confirmed',
    'confirmed': 'confirmed',
    'dispatched_by_sender': 'in_transit',
    'collected_from_sender': 'in_transit',
    'taken_by_courier': 'in_transit',
    'adopted_at_source_branch': 'in_transit',
    'sent_from_source_branch': 'in_transit',
    'ready_to_pickup': 'ready_for_pickup',
    'out_for_delivery': 'out_for_delivery',
    'delivered': 'delivered',
    'pickup_reminder_sent': 'ready_for_pickup',
    'pickup_time_expired': 'exception',
    'avizo': 'exception',
    'claimed': 'exception',
    'returned_to_sender': 'returned',
    'canceled': 'cancelled'
  };

  return statusMap[inpostStatus] || 'unknown';
}

// Available InPost services
export const INPOST_SERVICES = {
  LOCKER_STANDARD: 'inpost_locker_standard',      // Paczkomat standard
  LOCKER_ECONOMY: 'inpost_locker_economy',        // Paczkomat ekonomiczny
  COURIER_STANDARD: 'inpost_courier_standard',    // Kurier standard
  COURIER_EXPRESS: 'inpost_courier_express_1000', // Kurier express do 10:00
  COURIER_C2C: 'inpost_courier_c2c'               // Kurier C2C
};
