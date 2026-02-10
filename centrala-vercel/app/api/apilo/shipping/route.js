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

      // Log raw Apilo shipment data for debugging field names
      if (shipments && shipments.length > 0) {
        console.log('[Shipping GET] Raw Apilo shipment keys:', JSON.stringify(Object.keys(shipments[0] || {})));
        console.log('[Shipping GET] Raw first shipment:', JSON.stringify(shipments[0]));
      }

      // Sync Apilo shipments to local DB for badge display on order list
      if (shipments && shipments.length > 0) {
        for (const s of shipments) {
          const courierShipmentId = (s.shipmentId || s.id || '').toString();
          const trackingNumber = s.tracking || s.trackingNumber || s.idExternal || '';
          const courier = s.carrierAccount?.name || s.carrierProvider?.name || s.courierName || s.carrier || 'apilo';
          const status = s.status || 'created';

          if (courierShipmentId) {
            // Check if exists
            const { rows: existing } = await sql`
              SELECT id FROM shipments WHERE order_id = ${orderId} AND courier_shipment_id = ${courierShipmentId}
            `;
            if (existing.length > 0) {
              await sql`
                UPDATE shipments SET
                  tracking_number = ${trackingNumber},
                  courier = ${courier},
                  status = ${status},
                  updated_at = CURRENT_TIMESTAMP
                WHERE id = ${existing[0].id}
              `;
            } else {
              await sql`
                INSERT INTO shipments (order_id, courier, courier_shipment_id, tracking_number, status, created_at)
                VALUES (${orderId}, ${courier}, ${courierShipmentId}, ${trackingNumber}, ${status}, CURRENT_TIMESTAMP)
              `;
            }
          }
        }
      }

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
        carrierName,
        methodName,
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

      // Save to local database - try multiple response structures
      const shipmentId = result?.shipments?.[0]?.shipmentId
        || result?.shipments?.[0]?.id
        || result?.shipmentId
        || result?.id
        || result?.list?.[0]?.shipmentId
        || result?.list?.[0]?.id;

      console.log('[Shipping] Create result keys:', JSON.stringify(Object.keys(result || {})));
      console.log('[Shipping] Resolved shipmentId:', shipmentId);

      // Extract tracking from result
      const firstShipment = result?.shipments?.[0] || result?.list?.[0] || result || {};
      const trackingNumber = firstShipment.tracking || firstShipment.trackingNumber || firstShipment.idExternal || '';
      const courierLabel = carrierName || firstShipment.carrierName || firstShipment.carrier || 'apilo';

      console.log('[Shipping] Raw first shipment:', JSON.stringify(firstShipment));
      console.log('[Shipping] Tracking:', trackingNumber, 'Carrier:', courierLabel);

      if (shipmentId) {
        // Check if record exists, then insert or update
        const { rows: existing } = await sql`
          SELECT id FROM shipments WHERE order_id = ${orderId} AND courier_shipment_id = ${shipmentId.toString()}
        `;
        if (existing.length > 0) {
          await sql`
            UPDATE shipments SET
              status = 'created',
              courier = ${courierLabel},
              tracking_number = ${trackingNumber},
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ${existing[0].id}
          `;
        } else {
          await sql`
            INSERT INTO shipments (
              order_id, courier, courier_shipment_id, tracking_number, status,
              receiver_name, receiver_address, receiver_city, receiver_postal_code,
              weight, dimensions, created_at
            ) VALUES (
              ${orderId}, ${courierLabel}, ${shipmentId.toString()}, ${trackingNumber}, 'created',
              ${addressReceiver?.name || ''}, ${addressReceiver?.streetName || ''},
              ${addressReceiver?.city || ''}, ${addressReceiver?.zipCode || ''},
              ${parcels?.[0]?.weight || 1}, ${JSON.stringify(parcels?.[0]?.dimensions || {})}::jsonb,
              CURRENT_TIMESTAMP
            )
          `;
        }
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
    // Return more details about the error
    const errorDetails = {
      message: error.message,
      responseData: error.response?.data,
      responseStatus: error.response?.status
    };
    console.error('Error details:', JSON.stringify(errorDetails));
    return Response.json({
      success: false,
      error: error.message,
      details: errorDetails
    }, { status: 500 });
  }
}
