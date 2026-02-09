// Debug endpoint to see raw Apilo API responses
import { getCarriers, getCarrierAccounts } from '../../../../lib/apilo';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

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

    return Response.json({ success: true, debug: results });
  } catch (error) {
    return Response.json({ success: false, error: error.message, stack: error.stack }, { status: 500 });
  }
}
