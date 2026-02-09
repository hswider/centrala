import { initDatabase } from '../../../../../lib/db';
import * as inpost from '../../../../../lib/couriers/inpost';
import * as dhl from '../../../../../lib/couriers/dhl';
import * as ups from '../../../../../lib/couriers/ups';
import { getShipmentByTracking, updateShipmentStatus } from '../../../../../lib/couriers/index';

// GET - Track shipment
export async function GET(request, { params }) {
  try {
    await initDatabase();

    const { courier } = await params;
    const { searchParams } = new URL(request.url);
    const trackingNumber = searchParams.get('tracking');

    if (!trackingNumber) {
      return Response.json({ success: false, error: 'Brak numeru sledzenia' }, { status: 400 });
    }

    // Track with appropriate courier
    let trackingData;
    if (courier === 'inpost') {
      trackingData = await inpost.trackShipment(trackingNumber);
    } else if (courier === 'dhl_parcel' || courier === 'dhl_express') {
      trackingData = await dhl.trackShipment(trackingNumber);
    } else if (courier === 'ups') {
      trackingData = await ups.trackShipment(trackingNumber);
    } else {
      return Response.json({ success: false, error: `Nieprawidlowy kurier: ${courier}` }, { status: 400 });
    }

    // Update local shipment status if exists
    const localShipment = await getShipmentByTracking(trackingNumber);
    if (localShipment) {
      const status = extractStatus(courier, trackingData);
      if (status) {
        await updateShipmentStatus(localShipment.id, status.code, status.description);
      }
    }

    return Response.json({
      success: true,
      tracking_number: trackingNumber,
      courier,
      tracking: trackingData,
      local_shipment: localShipment
    });
  } catch (error) {
    console.error(`Error tracking shipment:`, error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Extract status from courier-specific tracking response
function extractStatus(courier, trackingData) {
  try {
    if (courier === 'inpost') {
      const status = trackingData.tracking_details?.[0]?.status;
      return status ? { code: status, description: status } : null;
    } else if (courier === 'dhl_parcel' || courier === 'dhl_express') {
      const shipment = trackingData.shipments?.[0];
      const status = shipment?.status?.statusCode;
      const description = shipment?.status?.description;
      return status ? { code: mapDhlStatus(status), description } : null;
    } else if (courier === 'ups') {
      const pkg = trackingData.trackResponse?.shipment?.[0]?.package?.[0];
      const status = pkg?.currentStatus?.description;
      return status ? { code: mapUpsStatus(status), description: status } : null;
    }
  } catch (e) {
    console.error('Error extracting status:', e);
  }
  return null;
}

function mapDhlStatus(dhlStatus) {
  const map = {
    'transit': 'in_transit',
    'delivered': 'delivered',
    'failure': 'exception',
    'unknown': 'unknown'
  };
  return map[dhlStatus?.toLowerCase()] || dhlStatus;
}

function mapUpsStatus(upsStatus) {
  const statusLower = upsStatus?.toLowerCase() || '';
  if (statusLower.includes('delivered')) return 'delivered';
  if (statusLower.includes('transit')) return 'in_transit';
  if (statusLower.includes('out for delivery')) return 'out_for_delivery';
  if (statusLower.includes('pickup')) return 'ready_for_pickup';
  return 'in_transit';
}
