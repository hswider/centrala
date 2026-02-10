import { apiloRequestDirect, apiloRequestBinary } from '../../../../../../lib/apilo';
import { sql } from '@vercel/postgres';

// GET - Download shipment label PDF
// Apilo stores labels as media files. Flow:
// 1. Get shipment details from /rest/api/orders/{orderId}/shipment/{shipmentId}/
// 2. Read media UUID from shipment
// 3. Fetch PDF binary from /rest/api/media/{uuid}/
export async function GET(request, { params }) {
  try {
    const { shipmentId } = await params;
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!shipmentId) {
      return Response.json({ success: false, error: 'Missing shipmentId' }, { status: 400 });
    }

    let mediaUuid = null;

    // Strategy 1: orderId provided in query param
    if (orderId) {
      try {
        const shipment = await apiloRequestDirect('GET', `/rest/api/orders/${orderId}/shipment/${shipmentId}/`);
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
          const shipment = await apiloRequestDirect('GET', `/rest/api/orders/${rows[0].order_id}/shipment/${shipmentId}/`);
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
        shipmentId
      }, { status: 404 });
    }

    // Fetch PDF binary from Apilo media endpoint
    const pdfBuffer = await apiloRequestBinary(`/rest/api/media/${mediaUuid}/`);

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
