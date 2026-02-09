/**
 * DHL API Integration (Parcel PL + Express)
 *
 * DHL Parcel PL: https://dhl24.com.pl/webapi2 (WebAPI v2)
 * DHL Express: https://developer.dhl.com/api-reference/shipment-tracking
 */

import { getCourierCredentials, saveShipment } from './index';

// API URLs
// DHL Parcel PL uses WebAPI v2 (different from international DHL API)
const DHL_PARCEL_PL_SANDBOX = 'https://sandbox.dhl24.com.pl/webapi2';
const DHL_PARCEL_PL_PROD = 'https://dhl24.com.pl/webapi2';

const DHL_EXPRESS_SANDBOX = 'https://express.api.dhl.com/mydhlapi/test';
const DHL_EXPRESS_PROD = 'https://express.api.dhl.com/mydhlapi';

const DHL_TRACKING_URL = 'https://api-eu.dhl.com/track/shipments';

// Get base URL for API type
function getBaseUrl(courierType, environment) {
  if (courierType === 'dhl_parcel') {
    return environment === 'production' ? DHL_PARCEL_PL_PROD : DHL_PARCEL_PL_SANDBOX;
  } else {
    return environment === 'production' ? DHL_EXPRESS_PROD : DHL_EXPRESS_SANDBOX;
  }
}

// Make authenticated request to DHL Parcel PL API (WebAPI v2)
async function dhlParcelPlFetch(endpoint, payload, creds) {
  const baseUrl = getBaseUrl('dhl_parcel', creds.environment);
  const url = `${baseUrl}${endpoint}`;
  const extraConfig = creds.extra_config || {};

  // Add auth data to payload
  const authPayload = {
    ...payload,
    authData: {
      username: extraConfig.login,
      password: extraConfig.password
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(authPayload)
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(`DHL Parcel PL error: ${data.error}`);
  }

  return data;
}

// Make authenticated request to DHL Express API
async function dhlExpressFetch(endpoint, options = {}, creds = null) {
  if (!creds) {
    creds = await getCourierCredentials('dhl_express');
  }

  const extraConfig = creds.extra_config || {};
  const baseUrl = getBaseUrl('dhl_express', creds.environment);
  const url = `${baseUrl}${endpoint}`;

  const auth = Buffer.from(`${extraConfig.api_key}:${extraConfig.api_secret}`).toString('base64');

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
      ...options.headers
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DHL Express API error ${response.status}: ${errorText}`);
  }

  return response.json();
}

// ==================== DHL PARCEL PL ====================

// Create DHL Parcel PL shipment (WebAPI v2)
export async function createParcelShipment(shipmentData, options = {}) {
  const creds = await getCourierCredentials('dhl_parcel');
  const extraConfig = creds.extra_config || {};

  // DHL24 WebAPI v2 payload structure
  const payload = {
    shipments: [{
      shipper: {
        name: extraConfig.sender_name || 'POOM',
        postalCode: extraConfig.sender_postal_code || '00-001',
        city: extraConfig.sender_city || 'Warszawa',
        street: extraConfig.sender_street || 'ul. Przykladowa 1',
        houseNumber: extraConfig.sender_house || '1',
        contactPerson: extraConfig.sender_contact || 'POOM Shipping',
        contactEmail: extraConfig.sender_email || 'kontakt@poom.pl',
        contactPhone: extraConfig.sender_phone || '+48123456789'
      },
      receiver: {
        name: shipmentData.receiver.name,
        postalCode: shipmentData.receiver.postal_code,
        city: shipmentData.receiver.city,
        street: shipmentData.receiver.street,
        houseNumber: shipmentData.receiver.house_number || '',
        contactPerson: shipmentData.receiver.name,
        contactEmail: shipmentData.receiver.email || '',
        contactPhone: shipmentData.receiver.phone || ''
      },
      pieceList: shipmentData.parcels.map((p, i) => ({
        type: extraConfig.label_type || 'PACKAGE', // PACKAGE, ENVELOPE, PALLET
        width: p.dimensions?.width || 20,
        height: p.dimensions?.height || 10,
        length: p.dimensions?.length || 30,
        weight: p.weight || 1,
        quantity: 1,
        nonStandard: false
      })),
      serviceType: options.service_type || 'AH', // AH = Przesylka krajowa, PR = Premium
      payerType: 'SHIPPER',
      billing: {
        shippingPaymentType: 'SHIPPER',
        billingAccountNumber: extraConfig.sap_number,
        paymentType: 'BANK_TRANSFER'
      },
      content: options.content || shipmentData.content_description || 'Goods',
      reference: shipmentData.reference || shipmentData.order_id,
      shipmentDate: options.shipment_date || new Date().toISOString().split('T')[0],
      labelType: extraConfig.label_type || 'BLP' // BLP, ZBLP, LP
    }]
  };

  const result = await dhlParcelPlFetch('/rest/createShipments', payload, creds);

  if (!result.createShipmentResult || result.createShipmentResult.length === 0) {
    throw new Error('Brak odpowiedzi z DHL Parcel PL');
  }

  const shipmentResult = result.createShipmentResult[0];

  if (shipmentResult.error) {
    throw new Error(`DHL Parcel PL: ${shipmentResult.error}`);
  }

  // Save to database
  const savedShipment = await saveShipment({
    order_id: shipmentData.order_id,
    courier: 'dhl_parcel',
    tracking_number: shipmentResult.shipmentNumber,
    label_data: shipmentResult.label, // Base64 label
    status: 'created',
    receiver_name: shipmentData.receiver.name,
    receiver_address: shipmentData.receiver.street,
    receiver_city: shipmentData.receiver.city,
    receiver_postal_code: shipmentData.receiver.postal_code,
    receiver_country: shipmentData.receiver.country || 'PL',
    receiver_phone: shipmentData.receiver.phone,
    receiver_email: shipmentData.receiver.email,
    weight: shipmentData.parcels[0]?.weight,
    dimensions: shipmentData.parcels[0]?.dimensions,
    service_type: options.service_type || 'AH',
    courier_shipment_id: shipmentResult.shipmentNumber
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
      number: extraConfig.account_number
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

  const result = await dhlExpressFetch('/shipments', {
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

// Track shipment DHL Parcel PL (WebAPI v2)
export async function trackParcelShipment(trackingNumber) {
  const creds = await getCourierCredentials('dhl_parcel');

  const result = await dhlParcelPlFetch('/rest/getTrackAndTraceInfo', {
    shipmentId: trackingNumber
  }, creds);

  return result;
}

// Track shipment DHL Express (global API)
export async function trackExpressShipment(trackingNumber) {
  const creds = await getCourierCredentials('dhl_express');
  const extraConfig = creds.extra_config || {};

  const response = await fetch(`${DHL_TRACKING_URL}?trackingNumber=${trackingNumber}`, {
    headers: {
      'DHL-API-Key': extraConfig.api_key
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DHL Tracking error ${response.status}: ${errorText}`);
  }

  return response.json();
}

// Track shipment (auto-detect courier type or use provided)
export async function trackShipment(trackingNumber, courierType = null) {
  // If courier type provided, use it
  if (courierType === 'dhl_express') {
    return trackExpressShipment(trackingNumber);
  }
  if (courierType === 'dhl_parcel') {
    return trackParcelShipment(trackingNumber);
  }

  // Try Parcel PL first, then Express
  try {
    return await trackParcelShipment(trackingNumber);
  } catch (e) {
    return await trackExpressShipment(trackingNumber);
  }
}

// ==================== LABEL ====================

// Get label for DHL Parcel PL shipment (WebAPI v2)
export async function getParcelLabel(shipmentNumber) {
  const creds = await getCourierCredentials('dhl_parcel');
  const extraConfig = creds.extra_config || {};

  const result = await dhlParcelPlFetch('/rest/getLabels', {
    itemToLabelList: [{
      shipmentId: shipmentNumber,
      labelType: extraConfig.label_type || 'BLP'
    }]
  }, creds);

  if (!result.getLabelsResult || result.getLabelsResult.length === 0) {
    throw new Error('Brak etykiety z DHL Parcel PL');
  }

  const labelResult = result.getLabelsResult[0];
  if (labelResult.error) {
    throw new Error(`DHL Label error: ${labelResult.error}`);
  }

  return {
    data: labelResult.labelData,
    contentType: 'application/pdf'
  };
}

// ==================== PICKUP ====================

// Create pickup request DHL Parcel PL (WebAPI v2)
export async function createParcelPickup(options = {}) {
  const creds = await getCourierCredentials('dhl_parcel');
  const extraConfig = creds.extra_config || {};

  // If permanent pickup enabled, no need to order
  if (extraConfig.permanent_pickup) {
    return { success: true, message: 'Staly odbior - kurier przyjedzie automatycznie' };
  }

  const pickupDate = options.pickup_date || new Date().toISOString().split('T')[0];

  const payload = {
    pickupAddress: {
      name: extraConfig.sender_name || 'POOM',
      postalCode: extraConfig.sender_postal_code || '00-001',
      city: extraConfig.sender_city || 'Warszawa',
      street: extraConfig.sender_street || 'ul. Przykladowa 1',
      houseNumber: extraConfig.sender_house || '1',
      contactPerson: extraConfig.sender_contact || 'POOM Shipping',
      contactPhone: extraConfig.sender_phone || '+48123456789'
    },
    pickupDate: pickupDate,
    pickupTimeFrom: options.pickup_time_from || '10:00',
    pickupTimeTo: options.pickup_time_to || '18:00'
  };

  return dhlParcelPlFetch('/rest/orderCourierPickup', payload, creds);
}

// Create pickup request (DHL Express)
export async function createExpressPickup(options = {}) {
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
      number: extraConfig.account_number
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
        number: extraConfig.account_number
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

  return dhlExpressFetch('/pickups', {
    method: 'POST',
    body: JSON.stringify(payload)
  }, creds);
}

// Generic pickup function
export async function createPickup(options = {}) {
  const courierType = options.courier_type || 'dhl_parcel';
  if (courierType === 'dhl_express') {
    return createExpressPickup(options);
  }
  return createParcelPickup(options);
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
