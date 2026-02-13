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

    // Resolve orderId from local DB if not provided
    if (!resolvedOrderId) {
      try {
        const { rows } = await sql`
          SELECT order_id FROM shipments WHERE courier_shipment_id = ${shipmentId.toString()} LIMIT 1
        `;
        if (rows.length > 0) resolvedOrderId = rows[0].order_id;
      } catch (e) {
        console.warn('[Label] DB lookup failed:', e.message);
      }
    }

    // Strategy 1: Get shipment details and read media UUID
    if (resolvedOrderId) {
      try {
        const shipment = await apiloRequestDirect('GET', `/rest/api/orders/${resolvedOrderId}/shipment/${shipmentId}/`);
        console.log('[Label] Shipment fields:', JSON.stringify(Object.keys(shipment || {})));
        mediaUuid = shipment?.media;

        // Strategy 2: If media is null, try label/document fields
        if (!mediaUuid && shipment?.label) mediaUuid = shipment.label;
        if (!mediaUuid && shipment?.documents?.[0]?.media) mediaUuid = shipment.documents[0].media;
      } catch (e) {
        console.warn('[Label] Shipment fetch failed:', e.message);
      }
    }

    // Strategy 3: Try direct shipment label endpoint
    if (!mediaUuid && resolvedOrderId) {
      try {
        const { getAccessToken } = await import('../../../../../../lib/apilo');
        const token = await getAccessToken();
        const baseUrl = process.env.APILO_BASE_URL || 'https://poom.apilo.com';

        const labelRes = await fetch(`${baseUrl}/rest/api/orders/${resolvedOrderId}/shipment/${shipmentId}/label/`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/pdf' }
        });

        if (labelRes.ok) {
          const contentType = labelRes.headers.get('content-type') || '';
          if (contentType.includes('pdf')) {
            // Direct PDF response
            const pdfBuffer = await labelRes.arrayBuffer();
            return new Response(pdfBuffer, {
              headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="label-${shipmentId}.pdf"`
              }
            });
          } else {
            // Maybe JSON with media UUID
            const labelData = await labelRes.json();
            console.log('[Label] Direct label endpoint response:', JSON.stringify(labelData));
            mediaUuid = labelData?.media || labelData?.uuid;
          }
        } else {
          console.warn('[Label] Direct label endpoint:', labelRes.status, labelRes.statusText);
        }
      } catch (e) {
        console.warn('[Label] Direct label endpoint failed:', e.message);
      }
    }

    if (!mediaUuid) {
      return Response.json({
        success: false,
        error: 'Nie znaleziono etykiety. Pobierz ja recznie z panelu Apilo.',
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
