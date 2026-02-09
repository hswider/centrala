import { createShipment, notifyShipmentCreated, getOrderShipments, uploadFile, getShipmentLabel } from '../../../../lib/apilo';
import { sql } from '@vercel/postgres';
import { initDatabase } from '../../../../lib/db';

// GET - Get shipments for an order or shipment details
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const shipmentId = searchParams.get('shipmentId');
    const action = searchParams.get('action');

    if (action === 'label' && shipmentId) {
      // Get shipment label
      const label = await getShipmentLabel(shipmentId);
      return Response.json({ success: true, label });
    }

    if (orderId) {
      // Get shipments for order from Apilo
      const shipments = await getOrderShipments(orderId);

      // Also get local shipments from our database
      await initDatabase();
      const { rows: localShipments } = await sql`
        SELECT * FROM shipments WHERE order_id = ${orderId}
      `;

      return Response.json({
        success: true,
        shipments: shipments,
        localShipments: localShipments
      });
    }

    return Response.json({ success: false, error: 'Missing orderId parameter' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching shipments:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Create shipment through Apilo or notify about external shipment
export async function POST(request) {
  try {
    await initDatabase();
    const body = await request.json();
    const { action } = body;

    if (action === 'create') {
      // Create shipment through Apilo's courier integration
      const {
        carrierAccountId,
        orderId,
        method,
        addressReceiver,
        parcels,
        options
      } = body;

      if (!carrierAccountId || !orderId || !method) {
        return Response.json({
          success: false,
          error: 'Wymagane: carrierAccountId, orderId, method'
        }, { status: 400 });
      }

      const result = await createShipment({
        carrierAccountId,
        orderId,
        method,
        addressReceiver,
        parcels: parcels || [{ weight: 1, dimensions: { length: 30, width: 20, height: 10 } }],
        options: options || []
      });

      // Save to local database
      if (result?.shipments?.[0]?.shipmentId) {
        const shipmentId = result.shipments[0].shipmentId;

        await sql`
          INSERT INTO shipments (
            order_id, courier, courier_shipment_id, status,
            receiver_name, receiver_address, receiver_city, receiver_postal_code,
            weight, dimensions, created_at
          ) VALUES (
            ${orderId}, 'apilo', ${shipmentId.toString()}, 'created',
            ${addressReceiver?.name || ''}, ${addressReceiver?.streetName || ''},
            ${addressReceiver?.city || ''}, ${addressReceiver?.zipCode || ''},
            ${parcels?.[0]?.weight || 1}, ${JSON.stringify(parcels?.[0]?.dimensions || {})}::jsonb,
            CURRENT_TIMESTAMP
          )
          ON CONFLICT (order_id, courier) DO UPDATE SET
            courier_shipment_id = ${shipmentId.toString()},
            status = 'created',
            updated_at = CURRENT_TIMESTAMP
        `;
      }

      return Response.json({ success: true, result });

    } else if (action === 'notify') {
      // Notify Apilo about shipment created externally
      const {
        orderId,
        idExternal,
        tracking,
        carrierProviderId,
        labelBase64
      } = body;

      if (!orderId || !tracking || !carrierProviderId) {
        return Response.json({
          success: false,
          error: 'Wymagane: orderId, tracking, carrierProviderId'
        }, { status: 400 });
      }

      // If label provided, upload it first
      let mediaUuid = null;
      if (labelBase64) {
        mediaUuid = await uploadFile(labelBase64, `label-${tracking}.pdf`, 'application/pdf');
      }

      const result = await notifyShipmentCreated(orderId, {
        idExternal: idExternal || tracking,
        tracking,
        carrierProviderId,
        media: mediaUuid
      });

      return Response.json({ success: true, result, mediaUuid });

    } else {
      return Response.json({ success: false, error: 'Invalid action. Use "create" or "notify"' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error creating shipment:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
