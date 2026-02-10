import { apiloRequestDirect } from '../../../../../../lib/apilo';
import { sql } from '@vercel/postgres';

// GET - Download shipment label PDF
// Apilo stores labels as media files. Flow:
// 1. Get shipment details -> read media UUID
// 2. Fetch PDF binary from /rest/api/media/{uuid}/ using fetch (not axios, to preserve binary)
export async function GET(request, { params }) {
  try {
    const { shipmentId } = await params;
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!shipmentId) {
      return Response.json({ success: false, error: 'Missing shipmentId' }, { status: 400 });
    }

    let mediaUuid = null;
    let resolvedOrderId = orderId;

    // Strategy 1: orderId provided in query param
    if (resolvedOrderId) {
      try {
        const shipment = await apiloRequestDirect('GET', `/rest/api/orders/${resolvedOrderId}/shipment/${shipmentId}/`);
        mediaUuid = shipment?.media;
      } catch (e) {
        console.warn('[Label] Shipment fetch via orderId param failed:', e.message);
      }
    }

    // Strategy 2: look up orderId from local DB
    if (!mediaUuid) {
      try {
        const { rows } = await sql`
          SELECT order_id FROM shipments WHERE courier_shipment_id = ${shipmentId.toString()} LIMIT 1
        `;
        if (rows.length > 0) {
          resolvedOrderId = rows[0].order_id;
          const shipment = await apiloRequestDirect('GET', `/rest/api/orders/${resolvedOrderId}/shipment/${shipmentId}/`);
          mediaUuid = shipment?.media;
        }
      } catch (e) {
        console.warn('[Label] Shipment fetch via local DB failed:', e.message);
      }
    }

    if (!mediaUuid) {
      return Response.json({
        success: false,
        error: 'Nie znaleziono etykiety.',
        shipmentId,
        orderId: resolvedOrderId
      }, { status: 404 });
    }

    // Get access token for Apilo API
    const { getAccessToken } = await import('../../../../../../lib/apilo');
    const token = await getAccessToken();
    const baseUrl = process.env.APILO_BASE_URL || 'https://poom.apilo.com';

    // Use native fetch to get binary PDF - axios corrupts binary data
    const pdfResponse = await fetch(`${baseUrl}/rest/api/media/${mediaUuid}/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!pdfResponse.ok) {
      return Response.json({
        success: false,
        error: `Media fetch failed: ${pdfResponse.status} ${pdfResponse.statusText}`
      }, { status: pdfResponse.status });
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="label-${shipmentId}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error getting label:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
