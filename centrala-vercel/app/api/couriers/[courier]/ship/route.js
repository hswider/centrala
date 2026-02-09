import { cookies } from 'next/headers';
import { initDatabase } from '../../../../../lib/db';
import { createShipmentPayload, COURIER_NAMES } from '../../../../../lib/couriers/index';
import * as inpost from '../../../../../lib/couriers/inpost';
import * as dhl from '../../../../../lib/couriers/dhl';
import * as ups from '../../../../../lib/couriers/ups';

// Check admin access
async function checkAccess() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get('poom_user')?.value;
  if (!userCookie) return false;
  try {
    const user = JSON.parse(userCookie);
    return ['it_admin', 'it_administrator', 'admin'].includes(user.role);
  } catch (e) {
    return false;
  }
}

// POST - Create shipment with specific courier
export async function POST(request, { params }) {
  try {
    const hasAccess = await checkAccess();
    if (!hasAccess) {
      return Response.json({ success: false, error: 'Brak dostepu' }, { status: 403 });
    }

    await initDatabase();

    const { courier } = await params;
    const body = await request.json();

    // Validate courier
    const validCouriers = ['inpost', 'dhl_parcel', 'dhl_express', 'ups'];
    if (!validCouriers.includes(courier)) {
      return Response.json({ success: false, error: `Nieprawidlowy kurier: ${courier}` }, { status: 400 });
    }

    // Build shipment data from request
    const shipmentData = {
      order_id: body.order_id,
      reference: body.reference || body.order_id,
      receiver: {
        name: body.receiver_name,
        company: body.receiver_company,
        street: body.receiver_street,
        city: body.receiver_city,
        postal_code: body.receiver_postal_code,
        country: body.receiver_country || 'PL',
        phone: body.receiver_phone,
        email: body.receiver_email
      },
      parcels: body.parcels || [{
        weight: body.weight || 1,
        dimensions: body.dimensions || { length: 30, width: 20, height: 10 }
      }]
    };

    const options = {
      service: body.service_type,
      service_type: body.service_type,
      product: body.service_type,
      target_point: body.target_point,
      dropoff_point: body.dropoff_point,
      description: body.description,
      request_pickup: body.request_pickup,
      ...body.options
    };

    // Create shipment
    let result;
    if (courier === 'inpost') {
      result = await inpost.createShipment(shipmentData, options);
    } else if (courier === 'dhl_parcel') {
      result = await dhl.createShipment(shipmentData, { courier_type: 'dhl_parcel', ...options });
    } else if (courier === 'dhl_express') {
      result = await dhl.createShipment(shipmentData, { courier_type: 'dhl_express', ...options });
    } else if (courier === 'ups') {
      result = await ups.createShipment(shipmentData, options);
    }

    return Response.json({
      success: true,
      shipment: result.shipment,
      courier_response: result.courier_response,
      courier_name: COURIER_NAMES[courier]
    });
  } catch (error) {
    console.error(`Error creating ${(await params).courier} shipment:`, error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
