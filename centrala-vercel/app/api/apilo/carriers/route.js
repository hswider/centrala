import { getCarriers, getCarrierAccounts, getShippingMethods, getShippingMethodOptions } from '../../../../lib/apilo';

// Normalize array response - Apilo may return array or object with items
function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    // Check for common wrapper properties
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.results)) return data.results;
    // If it's an object with numeric keys, convert to array
    const keys = Object.keys(data);
    if (keys.length > 0 && keys.every(k => !isNaN(parseInt(k)))) {
      return Object.values(data);
    }
  }
  return [];
}

// GET - List carriers or carrier accounts
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'carriers';
    const carrierAccountId = searchParams.get('carrierAccountId');
    const methodUuid = searchParams.get('methodUuid');

    if (type === 'carriers') {
      // Get list of all carrier providers (DHL, InPost, UPS, etc.)
      const rawData = await getCarriers();
      const carriers = normalizeArray(rawData);
      console.log('[Apilo Carriers] carriers:', carriers.length);
      return Response.json({ success: true, carriers });
    }

    if (type === 'accounts') {
      // Get configured carrier accounts (integrations set up in Apilo)
      const rawData = await getCarrierAccounts();
      console.log('[Apilo Carriers] raw accounts data:', JSON.stringify(rawData).substring(0, 500));
      const accounts = normalizeArray(rawData);
      console.log('[Apilo Carriers] accounts:', accounts.length);
      return Response.json({ success: true, accounts });
    }

    if (type === 'methods' && carrierAccountId) {
      // Get shipping methods for a carrier account
      const rawData = await getShippingMethods(carrierAccountId);
      console.log('[Apilo Carriers] raw methods data:', JSON.stringify(rawData).substring(0, 500));
      const methods = normalizeArray(rawData);
      console.log('[Apilo Carriers] methods for', carrierAccountId, ':', methods.length);
      return Response.json({ success: true, methods });
    }

    if (type === 'options' && carrierAccountId && methodUuid) {
      // Get options/map for a shipping method
      const options = await getShippingMethodOptions(carrierAccountId, methodUuid);
      return Response.json({ success: true, options });
    }

    return Response.json({ success: false, error: 'Invalid type parameter' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching carriers:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
