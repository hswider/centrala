import { apiloRequestDirect } from '../../../../../../lib/apilo';
import { sql } from '@vercel/postgres';

// GET - Download shipment label PDF
export async function GET(request, { params }) {
  try {
    const { shipmentId } = await params;
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!shipmentId) {
      return Response.json({ success: false, error: 'Missing shipmentId' }, { status: 400 });
    }

    const { getAccessToken } = await import('../../../../../../lib/apilo');
    const token = await getAccessToken();
    const baseUrl = process.env.APILO_BASE_URL || 'https://poom.apilo.com';

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

    // Helper: try fetching a URL, return PDF response if successful
    const tryFetchPdf = async (url, label) => {
      try {
        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/pdf,application/json' }
        });
        console.log(`[Label] ${label}: ${res.status} ${res.headers.get('content-type')}`);
        if (res.ok) {
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('pdf') || ct.includes('octet-stream')) {
            return await res.arrayBuffer();
          }
          // JSON response - log and check for media UUID
          const data = await res.json();
          console.log(`[Label] ${label} JSON:`, JSON.stringify(data).substring(0, 500));
          return data;
        }
      } catch (e) {
        console.warn(`[Label] ${label} failed:`, e.message);
      }
      return null;
    };

    // Strategy 1: Shipping API - /rest/api/shipping/shipment/{id}/label/
    let result = await tryFetchPdf(`${baseUrl}/rest/api/shipping/shipment/${shipmentId}/label/`, 'shipping/label');
    if (result instanceof ArrayBuffer) {
      return new Response(result, {
        headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="label-${shipmentId}.pdf"` }
      });
    }

    // Strategy 2: Shipping API - shipment details for media UUID
    let mediaUuid = null;
    try {
      const shipment = await apiloRequestDirect('GET', `/rest/api/shipping/shipment/${shipmentId}/`);
      console.log('[Label] shipping/shipment fields:', JSON.stringify(Object.keys(shipment || {})));
      console.log('[Label] shipping/shipment data:', JSON.stringify(shipment).substring(0, 1000));
      mediaUuid = shipment?.media || shipment?.label || shipment?.labelMedia;
      if (!mediaUuid && shipment?.documents?.[0]) mediaUuid = shipment.documents[0].media || shipment.documents[0].uuid;
    } catch (e) {
      console.warn('[Label] shipping/shipment fetch failed:', e.message);
    }

    // Strategy 3: Order shipment API - /rest/api/orders/{orderId}/shipment/{id}/
    if (!mediaUuid && resolvedOrderId) {
      try {
        const shipment = await apiloRequestDirect('GET', `/rest/api/orders/${resolvedOrderId}/shipment/${shipmentId}/`);
        console.log('[Label] orders/shipment fields:', JSON.stringify(Object.keys(shipment || {})));
        console.log('[Label] orders/shipment data:', JSON.stringify(shipment).substring(0, 1000));
        mediaUuid = shipment?.media || shipment?.label || shipment?.labelMedia;
      } catch (e) {
        console.warn('[Label] orders/shipment fetch failed:', e.message);
      }
    }

    // Strategy 4: Order label endpoint
    if (!mediaUuid && resolvedOrderId) {
      result = await tryFetchPdf(`${baseUrl}/rest/api/orders/${resolvedOrderId}/shipment/${shipmentId}/label/`, 'orders/shipment/label');
      if (result instanceof ArrayBuffer) {
        return new Response(result, {
          headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="label-${shipmentId}.pdf"` }
        });
      }
      if (result) mediaUuid = result.media || result.uuid;
    }

    // Strategy 5: Shipping label via /rest/api/shipping/label/{id}/
    if (!mediaUuid) {
      result = await tryFetchPdf(`${baseUrl}/rest/api/shipping/label/${shipmentId}/`, 'shipping/label/id');
      if (result instanceof ArrayBuffer) {
        return new Response(result, {
          headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="label-${shipmentId}.pdf"` }
        });
      }
      if (result) mediaUuid = result.media || result.uuid;
    }

    if (!mediaUuid) {
      return Response.json({
        success: false,
        error: 'Nie znaleziono etykiety. Pobierz ja recznie z panelu Apilo.',
        shipmentId,
        orderId: resolvedOrderId
      }, { status: 404 });
    }

    // Fetch PDF binary via media UUID
    const pdfResponse = await fetch(`${baseUrl}/rest/api/media/${mediaUuid}/`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/pdf' }
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
