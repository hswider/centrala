// Debug endpoint to see raw Apilo API responses
import { getCarriers, getCarrierAccounts, getShippingMethods, getShippingMethodOptions, apiloRequestDirect } from '../../../../lib/apilo';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const carrierAccountId = searchParams.get('carrierAccountId');
    const methodUuid = searchParams.get('methodUuid');

    const results = {};

    if (type === 'all' || type === 'carriers') {
      try {
        const carriers = await getCarriers();
        results.carriers = {
          raw: carriers,
          type: typeof carriers,
          isArray: Array.isArray(carriers),
          keys: carriers && typeof carriers === 'object' ? Object.keys(carriers) : null
        };
      } catch (e) {
        results.carriers = { error: e.message };
      }
    }

    if (type === 'all' || type === 'accounts') {
      try {
        const accounts = await getCarrierAccounts();
        results.accounts = {
          raw: accounts,
          type: typeof accounts,
          isArray: Array.isArray(accounts),
          keys: accounts && typeof accounts === 'object' ? Object.keys(accounts) : null
        };
      } catch (e) {
        results.accounts = { error: e.message };
      }
    }

    if (type === 'methods') {
      if (!carrierAccountId) {
        results.methods = { error: 'Missing carrierAccountId parameter' };
      } else {
        try {
          const methods = await getShippingMethods(carrierAccountId);
          results.methods = {
            raw: methods,
            carrierAccountId,
            type: typeof methods,
            isArray: Array.isArray(methods)
          };
        } catch (e) {
          results.methods = { error: e.message, stack: e.stack };
        }
      }
    }

    if (type === 'options' && carrierAccountId && methodUuid) {
      try {
        const options = await getShippingMethodOptions(carrierAccountId, methodUuid);
        results.options = {
          raw: options,
          carrierAccountId,
          methodUuid
        };
      } catch (e) {
        results.options = { error: e.message };
      }
    }

    // Test carrier account details - try to find weight definitions
    if (type === 'account-details' && carrierAccountId) {
      const endpoints = [
        `/rest/api/shipping/carrier-account/${carrierAccountId}/`,
        `/rest/api/shipping/carrier-account/${carrierAccountId}/weight/`,
        `/rest/api/shipping/carrier-account/${carrierAccountId}/details/`,
        `/rest/api/shipping/carrier-account/${carrierAccountId}/config/`
      ];

      for (const endpoint of endpoints) {
        try {
          const data = await apiloRequestDirect('GET', endpoint);
          results[endpoint] = { success: true, data };
        } catch (e) {
          results[endpoint] = { error: e.message };
        }
      }
    }

    // Raw endpoint test
    if (type === 'raw') {
      const endpoint = searchParams.get('endpoint');
      if (endpoint) {
        try {
          const data = await apiloRequestDirect('GET', endpoint);
          results.raw = { endpoint, data };
        } catch (e) {
          results.raw = { endpoint, error: e.message };
        }
      } else {
        results.raw = { error: 'Missing endpoint parameter' };
      }
    }

    // Test shipment creation - dry run to see what Apilo expects
    if (type === 'test-shipment' && carrierAccountId) {
      const orderId = searchParams.get('orderId') || '12345';
      const method = searchParams.get('method') || methodUuid;

      const testPayload = {
        carrierAccountId: parseInt(carrierAccountId),
        orderId: orderId,
        method: method,
        postDate: new Date().toISOString(),
        addressReceiver: {
          type: 'house',
          name: 'Test Receiver',
          streetName: 'Test Street',
          streetNumber: '1',
          zipCode: '00-001',
          city: 'Warsaw',
          country: 'PL',
          phone: '123456789',
          email: 'test@test.com'
        },
        parcels: [{
          options: [
            {
              id: 'dimensions',
              type: 'dimensions',
              value: { length: 30, width: 20, height: 10 }
            },
            {
              id: 'weight',
              type: 'integer',
              value: 1000 // 1kg in grams
            }
          ]
        }],
        options: []
      };

      results.testShipment = {
        payload: testPayload,
        note: 'This shows what would be sent to Apilo'
      };

      // Try to create (will likely fail with test data but shows exact error)
      if (searchParams.get('execute') === 'true') {
        try {
          const data = await apiloRequestDirect('POST', '/rest/api/shipping/shipment/', testPayload);
          results.testShipment.result = { success: true, data };
        } catch (e) {
          results.testShipment.result = {
            error: e.message,
            status: e.response?.status,
            responseData: e.response?.data
          };
        }
      }
    }

    return Response.json({ success: true, debug: results });
  } catch (error) {
    return Response.json({ success: false, error: error.message, stack: error.stack }, { status: 500 });
  }
}
