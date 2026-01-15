import { NextResponse } from 'next/server';
import { isAuthenticated, getTickets } from '../../../../lib/kaufland';

export async function GET(request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Kaufland API not configured'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'opened';

    // Get raw response from Kaufland API
    const response = await getTickets(status, null, 30, 0);

    return NextResponse.json({
      success: true,
      status,
      rawResponse: response,
      dataLength: response?.data?.length || 0,
      keys: Object.keys(response || {})
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
