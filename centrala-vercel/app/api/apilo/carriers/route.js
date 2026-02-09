import { getCarriers, getCarrierAccounts, getShippingMethods, getShippingMethodOptions } from '../../../../lib/apilo';

// GET - List carriers or carrier accounts
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'carriers';
    const carrierAccountId = searchParams.get('carrierAccountId');
    const methodUuid = searchParams.get('methodUuid');

    if (type === 'carriers') {
      // Get list of all carrier providers (DHL, InPost, UPS, etc.)
      const carriers = await getCarriers();
      return Response.json({ success: true, carriers });
    }

    if (type === 'accounts') {
      // Get configured carrier accounts (integrations set up in Apilo)
      const accounts = await getCarrierAccounts();
      return Response.json({ success: true, accounts });
    }

    if (type === 'methods' && carrierAccountId) {
      // Get shipping methods for a carrier account
      const methods = await getShippingMethods(carrierAccountId);
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
