import { apiloRequestDirect } from '../../../../../../lib/apilo';
import { sql } from '@vercel/postgres';

// GET - Download shipment label PDF
// Apilo stores labels as media files. Flow:
// 1. Get shipment details from /rest/api/orders/{orderId}/shipment/{shipmentId}/
// 2. Read media UUID from shipment
// 3. Fetch PDF from /rest/api/media/{uuid}/ using same JSON API (returns raw PDF string)
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
        error: 'Nie znaleziono etykiety. Sprawdz czy przesylka ma wygenerowana etykiete w Apilo.',
        shipmentId,
        orderId: resolvedOrderId
      }, { status: 404 });
    }

    // Fetch PDF from Apilo media endpoint using the standard JSON API
    // apiloRequestDirect returns the response data directly - for media it's the raw PDF content
    const pdfContent = await apiloRequestDirect('GET', `/rest/api/media/${mediaUuid}/`);

    if (!pdfContent) {
      return Response.json({ success: false, error: 'Label media empty' }, { status: 404 });
    }

    // pdfContent is the raw PDF as a string from axios JSON parsing
    // Convert to buffer - if it starts with %PDF it's raw PDF text
    let buffer;
    if (typeof pdfContent === 'string') {
      buffer = Buffer.from(pdfContent, 'binary');
    } else if (pdfContent instanceof ArrayBuffer || Buffer.isBuffer(pdfContent)) {
      buffer = Buffer.from(pdfContent);
    } else {
      // If it's an object, it might have content field
      if (pdfContent.content) {
        buffer = Buffer.from(pdfContent.content, 'base64');
      } else {
        return Response.json({ success: true, label: pdfContent, note: 'Unexpected format' });
      }
    }

    return new Response(buffer, {
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
