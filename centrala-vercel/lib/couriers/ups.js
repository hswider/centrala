/**
 * UPS API Integration
 *
 * Documentation: https://developer.ups.com/
 * Uses OAuth2 Client Credentials flow
 */

import { getCourierCredentials, saveShipment } from './index';
import { sql } from '@vercel/postgres';

// API URLs
const UPS_SANDBOX = 'https://wwwcie.ups.com';
const UPS_PRODUCTION = 'https://onlinetools.ups.com';

// Token cache (in-memory, refresh when needed)
let tokenCache = {
  token: null,
  expiresAt: 0
};

// Get base URL
function getBaseUrl(environment) {
  return environment === 'production' ? UPS_PRODUCTION : UPS_SANDBOX;
}

// Get OAuth2 access token
async function getAccessToken(creds) {
  // Check cache
  if (tokenCache.token && tokenCache.expiresAt > Date.now() + 60000) {
    return tokenCache.token;
  }

  const baseUrl = getBaseUrl(creds.environment);
  const auth = Buffer.from(`${creds.api_key}:${creds.api_secret}`).toString('base64');

  const response = await fetch(`${baseUrl}/security/v1/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`UPS OAuth error ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  // Cache token
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000)
  };

  return data.access_token;
}

// Make authenticated request to UPS API
async function upsFetch(endpoint, options = {}, creds = null) {
  if (!creds) {
    creds = await getCourierCredentials('ups');
  }

  const token = await getAccessToken(creds);
  const baseUrl = getBaseUrl(creds.environment);
  const url = `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'transId': `tx-${Date.now()}`,
      'transactionSrc': 'POOM-Centrala',
      ...options.headers
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`UPS API error ${response.status}: ${errorText}`);
  }

  return response.json();
}

// Create UPS shipment
export async function createShipment(shipmentData, options = {}) {
  const creds = await getCourierCredentials('ups');
  const extraConfig = creds.extra_config || {};

  const payload = {
    ShipmentRequest: {
      Request: {
        SubVersion: '1801',
        RequestOption: 'nonvalidate',
        TransactionReference: {
          CustomerContext: shipmentData.reference
        }
      },
      Shipment: {
        Description: options.description || 'Goods',
        Shipper: {
          Name: extraConfig.shipper_name || 'POOM',
          AttentionName: extraConfig.shipper_attention || 'Shipping Department',
          TaxIdentificationNumber: extraConfig.tax_id || '',
          Phone: {
            Number: extraConfig.sender_phone || '123456789'
          },
          ShipperNumber: creds.account_number,
          Address: {
            AddressLine: [extraConfig.sender_street || 'ul. Przykladowa 1'],
            City: extraConfig.sender_city || 'Warsaw',
            PostalCode: extraConfig.sender_postal_code || '00-001',
            CountryCode: 'PL'
          }
        },
        ShipTo: {
          Name: shipmentData.receiver.name,
          AttentionName: shipmentData.receiver.name,
          Phone: {
            Number: shipmentData.receiver.phone?.replace(/\s/g, '') || '000000000'
          },
          Address: {
            AddressLine: [shipmentData.receiver.street],
            City: shipmentData.receiver.city,
            PostalCode: shipmentData.receiver.postal_code,
            CountryCode: shipmentData.receiver.country || 'PL'
          }
        },
        ShipFrom: {
          Name: extraConfig.shipper_name || 'POOM',
          AttentionName: extraConfig.shipper_attention || 'Shipping Department',
          Phone: {
            Number: extraConfig.sender_phone || '123456789'
          },
          Address: {
            AddressLine: [extraConfig.sender_street || 'ul. Przykladowa 1'],
            City: extraConfig.sender_city || 'Warsaw',
            PostalCode: extraConfig.sender_postal_code || '00-001',
            CountryCode: 'PL'
          }
        },
        PaymentInformation: {
          ShipmentCharge: [{
            Type: '01', // Transportation
            BillShipper: {
              AccountNumber: creds.account_number
            }
          }]
        },
        Service: {
          Code: options.service || '11', // UPS Standard
          Description: options.service_description || 'UPS Standard'
        },
        Package: shipmentData.parcels.map((p, i) => ({
          Description: `Package ${i + 1}`,
          Packaging: {
            Code: options.packaging || '02', // Customer Supplied Package
            Description: 'Package'
          },
          Dimensions: {
            UnitOfMeasurement: {
              Code: 'CM',
              Description: 'Centimeters'
            },
            Length: String(p.dimensions?.length || 30),
            Width: String(p.dimensions?.width || 20),
            Height: String(p.dimensions?.height || 10)
          },
          PackageWeight: {
            UnitOfMeasurement: {
              Code: 'KGS',
              Description: 'Kilograms'
            },
            Weight: String(p.weight || 1)
          }
        }))
      },
      LabelSpecification: {
        LabelImageFormat: {
          Code: 'PDF',
          Description: 'PDF'
        },
        LabelStockSize: {
          Height: '6',
          Width: '4'
        }
      }
    }
  };

  const result = await upsFetch('/api/shipments/v1/ship', {
    method: 'POST',
    body: JSON.stringify(payload)
  }, creds);

  const shipmentResponse = result.ShipmentResponse?.ShipmentResults;
  if (!shipmentResponse) {
    throw new Error('Brak odpowiedzi z UPS');
  }

  const trackingNumber = shipmentResponse.ShipmentIdentificationNumber;
  const labelData = shipmentResponse.PackageResults?.[0]?.ShippingLabel?.GraphicImage;

  // Save to database
  const savedShipment = await saveShipment({
    order_id: shipmentData.order_id,
    courier: 'ups',
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
    service_type: options.service || '11',
    courier_shipment_id: trackingNumber
  });

  return {
    shipment: savedShipment,
    courier_response: result
  };
}

// Track shipment
export async function trackShipment(trackingNumber) {
  const creds = await getCourierCredentials('ups');

  const result = await upsFetch(
    `/api/track/v1/details/${trackingNumber}?locale=pl_PL&returnSignature=false`,
    { method: 'GET' },
    creds
  );

  return result;
}

// Get label (re-download)
export async function getLabel(trackingNumber) {
  const creds = await getCourierCredentials('ups');

  const payload = {
    LabelRecoveryRequest: {
      Request: {
        SubVersion: '1903',
        TransactionReference: {
          CustomerContext: 'Label recovery'
        }
      },
      LabelSpecification: {
        LabelImageFormat: {
          Code: 'PDF'
        }
      },
      TrackingNumber: trackingNumber
    }
  };

  const result = await upsFetch('/api/labels/v1/recovery', {
    method: 'POST',
    body: JSON.stringify(payload)
  }, creds);

  const labelImage = result.LabelRecoveryResponse?.LabelResults?.LabelImage?.GraphicImage;

  return {
    data: labelImage,
    contentType: 'application/pdf'
  };
}

// Create pickup request
export async function createPickup(options = {}) {
  const creds = await getCourierCredentials('ups');
  const extraConfig = creds.extra_config || {};

  const pickupDate = options.pickup_date || new Date().toISOString().split('T')[0].replace(/-/g, '');

  const payload = {
    PickupCreationRequest: {
      Request: {
        TransactionReference: {
          CustomerContext: 'Pickup request'
        }
      },
      RatePickupIndicator: 'N',
      Shipper: {
        Account: {
          AccountNumber: creds.account_number,
          AccountCountryCode: 'PL'
        }
      },
      PickupDateInfo: {
        CloseTime: options.close_time?.replace(':', '') || '1800',
        ReadyTime: options.ready_time?.replace(':', '') || '0900',
        PickupDate: pickupDate
      },
      PickupAddress: {
        CompanyName: extraConfig.shipper_name || 'POOM',
        ContactName: extraConfig.shipper_attention || 'Shipping',
        AddressLine: extraConfig.sender_street || 'ul. Przykladowa 1',
        City: extraConfig.sender_city || 'Warsaw',
        PostalCode: extraConfig.sender_postal_code || '00-001',
        CountryCode: 'PL',
        Phone: {
          Number: extraConfig.sender_phone || '123456789'
        }
      },
      AlternateAddressIndicator: 'N',
      PickupPiece: [{
        ServiceCode: options.service || '011', // UPS Standard
        Quantity: String(options.package_count || 1),
        DestinationCountryCode: options.destination_country || 'DE',
        ContainerCode: '01' // Package
      }],
      TotalWeight: {
        Weight: String(options.total_weight || 5),
        UnitOfMeasurement: 'KGS'
      },
      OverweightIndicator: 'N',
      PaymentMethod: '01' // Account
    }
  };

  return upsFetch('/api/pickupcreation/v1/pickup', {
    method: 'POST',
    body: JSON.stringify(payload)
  }, creds);
}

// Cancel pickup
export async function cancelPickup(pickupNumber) {
  const creds = await getCourierCredentials('ups');

  return upsFetch(`/api/pickupcancel/v1/pickup/cancel/${pickupNumber}`, {
    method: 'DELETE'
  }, creds);
}

// UPS Service codes
export const UPS_SERVICES = {
  STANDARD: '11',           // UPS Standard (Europe)
  EXPRESS: '07',            // UPS Express
  EXPRESS_PLUS: '54',       // UPS Express Plus
  EXPRESS_SAVER: '65',      // UPS Express Saver
  EXPEDITED: '08',          // UPS Expedited
  WORLDWIDE_EXPRESS: '07',  // UPS Worldwide Express
  WORLDWIDE_SAVER: '65',    // UPS Worldwide Express Saver
  ACCESS_POINT: '70'        // UPS Access Point Economy
};

// UPS Package types
export const UPS_PACKAGING = {
  CUSTOMER: '02',           // Customer supplied package
  LETTER: '01',             // UPS Letter
  TUBE: '03',               // Tube
  PAK: '04',                // PAK
  EXPRESS_BOX_S: '2a',      // Express Box Small
  EXPRESS_BOX_M: '2b',      // Express Box Medium
  EXPRESS_BOX_L: '2c'       // Express Box Large
};
