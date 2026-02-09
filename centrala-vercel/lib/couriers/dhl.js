/**
 * DHL API Integration (Parcel PL + Express)
 *
 * DHL Parcel: https://developer.dhl.com/api-reference/parcel-de-shipping
 * DHL Express: https://developer.dhl.com/api-reference/shipment-tracking
 */

import { getCourierCredentials, saveShipment } from './index';

// API URLs
const DHL_PARCEL_SANDBOX = 'https://api-sandbox.dhl.com/parcel/de/shipping/v2';
const DHL_PARCEL_PROD = 'https://api-eu.dhl.com/parcel/de/shipping/v2';

const DHL_EXPRESS_SANDBOX = 'https://express.api.dhl.com/mydhlapi/test';
const DHL_EXPRESS_PROD = 'https://express.api.dhl.com/mydhlapi';

const DHL_TRACKING_URL = 'https://api-eu.dhl.com/track/shipments';

// Get base URL for API type
function getBaseUrl(courierType, environment) {
  if (courierType === 'dhl_parcel') {
    return environment === 'production' ? DHL_PARCEL_PROD : DHL_PARCEL_SANDBOX;
  } else {
    return environment === 'production' ? DHL_EXPRESS_PROD : DHL_EXPRESS_SANDBOX;
  }
}

// Make authenticated request to DHL API
async function dhlFetch(courierType, endpoint, options = {}, creds = null) {
  if (!creds) {
    creds = await getCourierCredentials(courierType);
  }

  const baseUrl = getBaseUrl(courierType, creds.environment);
  const url = `${baseUrl}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // DHL Parcel uses API Key
  if (courierType === 'dhl_parcel') {
    headers['DHL-API-Key'] = creds.api_key;
  } else {
    // DHL Express uses Basic Auth
    const auth = Buffer.from(`${creds.api_key}:${creds.api_secret}`).toString('base64');
    headers['Authorization'] = `Basic ${auth}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DHL API error ${response.status}: ${errorText}`);
  }

  return response.json();
}

// ==================== DHL PARCEL ====================

// Create DHL Parcel shipment
export async function createParcelShipment(shipmentData, options = {}) {
  const creds = await getCourierCredentials('dhl_parcel');
  const extraConfig = creds.extra_config || {};

  const payload = {
    profile: extraConfig.profile || 'STANDARD_GRUPPENPROFIL',
    shipments: [{
      product: options.product || 'V01PAK', // V01PAK = DHL Paket
      billingNumber: creds.account_number,
      refNo: shipmentData.reference,
      shipper: extraConfig.shipper || {
        name1: 'POOM',
        addressStreet: extraConfig.sender_street || 'ul. Przykladowa 1',
        postalCode: extraConfig.sender_postal_code || '00-001',
        city: extraConfig.sender_city || 'Warszawa',
        country: 'POL'
      },
      consignee: {
        name1: shipmentData.receiver.name,
        name2: shipmentData.receiver.company || undefined,
        addressStreet: shipmentData.receiver.street,
        postalCode: shipmentData.receiver.postal_code,
        city: shipmentData.receiver.city,
        country: mapCountryCode(shipmentData.receiver.country),
        email: shipmentData.receiver.email,
        phone: shipmentData.receiver.phone
      },
      details: {
        weight: {
          uom: 'kg',
          value: shipmentData.parcels[0]?.weight || 1
        },
        dim: shipmentData.parcels[0]?.dimensions ? {
          uom: 'cm',
          height: shipmentData.parcels[0].dimensions.height,
          length: shipmentData.parcels[0].dimensions.length,
          width: shipmentData.parcels[0].dimensions.width
        } : undefined
      }
    }]
  };

  const result = await dhlFetch('dhl_parcel', '/orders', {
    method: 'POST',
    body: JSON.stringify(payload)
  }, creds);

  const shipmentResult = result.items?.[0];
  if (!shipmentResult) {
    throw new Error('Brak odpowiedzi z DHL Parcel');
  }

  // Save to database
  const savedShipment = await saveShipment({
    order_id: shipmentData.order_id,
    courier: 'dhl_parcel',
    tracking_number: shipmentResult.shipmentNo,
    label_url: shipmentResult.label?.url,
    status: 'created',
    receiver_name: shipmentData.receiver.name,
    receiver_address: shipmentData.receiver.street,
    receiver_city: shipmentData.receiver.city,
    receiver_postal_code: shipmentData.receiver.postal_code,
    receiver_country: shipmentData.receiver.country,
    receiver_phone: shipmentData.receiver.phone,
    receiver_email: shipmentData.receiver.email,
    weight: shipmentData.parcels[0]?.weight,
    dimensions: shipmentData.parcels[0]?.dimensions,
    service_type: options.product || 'V01PAK',
    courier_shipment_id: shipmentResult.shipmentNo
  });

  return {
    shipment: savedShipment,
    courier_response: result
  };
}

// ==================== DHL EXPRESS ====================

// Create DHL Express shipment
export async function createExpressShipment(shipmentData, options = {}) {
  const creds = await getCourierCredentials('dhl_express');
  const extraConfig = creds.extra_config || {};

  const plannedDate = options.pickup_date || new Date().toISOString().split('T')[0];

  const payload = {
    plannedShippingDateAndTime: `${plannedDate}T10:00:00 GMT+01:00`,
    pickup: {
      isRequested: options.request_pickup || false,
      closeTime: options.pickup_close_time || '18:00',
      location: options.pickup_location || 'reception'
    },
    productCode: options.product || 'P', // P = Express Worldwide
    localProductCode: options.local_product || 'P',
    accounts: [{
      typeCode: 'shipper',
      number: creds.account_number
    }],
    customerDetails: {
      shipperDetails: extraConfig.shipper || {
        postalAddress: {
          postalCode: extraConfig.sender_postal_code || '00-001',
          cityName: extraConfig.sender_city || 'Warsaw',
          countryCode: 'PL',
          addressLine1: extraConfig.sender_street || 'ul. Przykladowa 1'
        },
        contactInformation: {
          email: extraConfig.sender_email || 'kontakt@poom.pl',
          phone: extraConfig.sender_phone || '+48123456789',
          companyName: 'POOM',
          fullName: extraConfig.sender_name || 'POOM Shipping'
        }
      },
      receiverDetails: {
        postalAddress: {
          postalCode: shipmentData.receiver.postal_code,
          cityName: shipmentData.receiver.city,
          countryCode: shipmentData.receiver.country || 'PL',
          addressLine1: shipmentData.receiver.street
        },
        contactInformation: {
          email: shipmentData.receiver.email,
          phone: shipmentData.receiver.phone,
          companyName: shipmentData.receiver.company || '',
          fullName: shipmentData.receiver.name
        }
      }
    },
    content: {
      packages: shipmentData.parcels.map((p, i) => ({
        weight: p.weight || 1,
        dimensions: {
          length: p.dimensions?.length || 30,
          width: p.dimensions?.width || 20,
          height: p.dimensions?.height || 10
        },
        customerReferences: [{
          value: shipmentData.reference,
          typeCode: 'CU'
        }]
      })),
      isCustomsDeclarable: false,
      declaredValue: options.declared_value || 100,
      declaredValueCurrency: options.currency || 'EUR',
      exportDeclaration: options.export_declaration,
      description: options.description || 'Goods'
    },
    shipmentNotification: shipmentData.receiver.email ? [{
      typeCode: 'email',
      receiverId: shipmentData.receiver.email,
      languageCode: 'pol'
    }] : undefined,
    getTransliteratedResponse: false,
    estimatedDeliveryDate: {
      isRequested: true,
      typeCode: 'QDDC'
    },
    getAdditionalInformation: [{
      typeCode: 'pickupDetails',
      isRequested: true
    }],
    outputImageProperties: {
      imageOptions: [{
        typeCode: 'label',
        templateName: 'ECOM26_84_001'
      }],
      splitTransportAndWaybillDocLabels: true,
      allDocumentsInOneImage: false,
      splitDocumentsByPages: false,
      splitInvoiceAndReceipt: true,
      encodingFormat: 'pdf'
    }
  };

  const result = await dhlFetch('dhl_express', '/shipments', {
    method: 'POST',
    body: JSON.stringify(payload)
  }, creds);

  const trackingNumber = result.shipmentTrackingNumber;
  const labelData = result.documents?.find(d => d.typeCode === 'label')?.content;

  // Save to database
  const savedShipment = await saveShipment({
    order_id: shipmentData.order_id,
    courier: 'dhl_express',
    tracking_number: trackingNumber,
    label_data: labelData,
    status: 'created',
    receiver_name: shipmentData.receiver.name,
    receiver_address: shipmentData.receiver.street,
    receiver_city: shipmentData.receiver.city,
    receiver_postal_code: shipmentData.receiver.postal_code,
    receiver_country: shipmentData.receiver.country,
    receiver_phone: shipmentData.receiver.phone,
    receiver_email: shipmentData.receiver.email,
    weight: shipmentData.parcels[0]?.weight,
    dimensions: shipmentData.parcels[0]?.dimensions,
    service_type: options.product || 'P',
    courier_shipment_id: trackingNumber
  });

  return {
    shipment: savedShipment,
    courier_response: result
  };
}

// Create shipment (router to Parcel or Express)
export async function createShipment(shipmentData, options = {}) {
  const courierType = options.courier_type || 'dhl_parcel';

  if (courierType === 'dhl_express') {
    return createExpressShipment(shipmentData, options);
  } else {
    return createParcelShipment(shipmentData, options);
  }
}

// ==================== TRACKING ====================

// Track shipment (works for both Parcel and Express)
export async function trackShipment(trackingNumber) {
  const creds = await getCourierCredentials('dhl_parcel'); // Tracking API uses same key

  const response = await fetch(`${DHL_TRACKING_URL}?trackingNumber=${trackingNumber}`, {
    headers: {
      'DHL-API-Key': creds.api_key
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DHL Tracking error ${response.status}: ${errorText}`);
  }

  return response.json();
}

// ==================== LABEL ====================

// Get label for DHL Parcel shipment
export async function getParcelLabel(shipmentNumber) {
  const creds = await getCourierCredentials('dhl_parcel');
  const baseUrl = getBaseUrl('dhl_parcel', creds.environment);

  const response = await fetch(`${baseUrl}/orders/${shipmentNumber}/label`, {
    headers: {
      'DHL-API-Key': creds.api_key,
      'Accept': 'application/pdf'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DHL label error ${response.status}: ${errorText}`);
  }

  const buffer = await response.arrayBuffer();
  return {
    data: Buffer.from(buffer).toString('base64'),
    contentType: 'application/pdf'
  };
}

// ==================== PICKUP ====================

// Create pickup request (DHL Express)
export async function createPickup(options = {}) {
  const creds = await getCourierCredentials('dhl_express');
  const extraConfig = creds.extra_config || {};

  const pickupDate = options.pickup_date || new Date().toISOString().split('T')[0];

  const payload = {
    plannedPickupDateAndTime: `${pickupDate}T${options.pickup_time || '14:00'}:00`,
    closeTime: options.close_time || '18:00',
    location: options.location || 'reception',
    locationType: options.location_type || 'residence',
    accounts: [{
      typeCode: 'shipper',
      number: creds.account_number
    }],
    customerDetails: {
      shipperDetails: extraConfig.shipper || {
        postalAddress: {
          postalCode: extraConfig.sender_postal_code || '00-001',
          cityName: extraConfig.sender_city || 'Warsaw',
          countryCode: 'PL',
          addressLine1: extraConfig.sender_street || 'ul. Przykladowa 1'
        },
        contactInformation: {
          email: extraConfig.sender_email || 'kontakt@poom.pl',
          phone: extraConfig.sender_phone || '+48123456789',
          companyName: 'POOM',
          fullName: extraConfig.sender_name || 'POOM Shipping'
        }
      }
    },
    shipmentDetails: [{
      productCode: options.product || 'P',
      localProductCode: options.local_product || 'P',
      accounts: [{
        typeCode: 'shipper',
        number: creds.account_number
      }],
      packages: [{
        weight: options.total_weight || 5,
        dimensions: {
          length: 40,
          width: 30,
          height: 20
        }
      }]
    }]
  };

  return dhlFetch('dhl_express', '/pickups', {
    method: 'POST',
    body: JSON.stringify(payload)
  }, creds);
}

// Map 2-letter country code to 3-letter (for DHL Parcel)
function mapCountryCode(code) {
  const map = {
    'PL': 'POL', 'DE': 'DEU', 'FR': 'FRA', 'GB': 'GBR', 'IT': 'ITA',
    'ES': 'ESP', 'NL': 'NLD', 'BE': 'BEL', 'AT': 'AUT', 'CH': 'CHE',
    'CZ': 'CZE', 'SK': 'SVK', 'HU': 'HUN', 'SE': 'SWE', 'DK': 'DNK',
    'NO': 'NOR', 'FI': 'FIN', 'PT': 'PRT', 'IE': 'IRL', 'LU': 'LUX'
  };
  return map[code?.toUpperCase()] || code;
}

// DHL Products
export const DHL_PARCEL_PRODUCTS = {
  PAKET: 'V01PAK',           // Standard parcel
  PAKET_INTL: 'V53WPAK',     // International parcel
  EUROPAKET: 'V54EPAK',      // Europaket
  WARENPOST: 'V62WP',        // Small goods
  WARENPOST_INTL: 'V66WPI'   // International small goods
};

export const DHL_EXPRESS_PRODUCTS = {
  WORLDWIDE: 'P',             // Express Worldwide
  WORLDWIDE_DOC: 'D',         // Express Worldwide Document
  DOMESTIC: 'N',              // Domestic Express
  ECONOMY: 'U'                // Economy Select
};
