import { sql } from '@vercel/postgres';
import { cookies } from 'next/headers';
import { initDatabase } from '../../../../lib/db';
import { getShipments, createShipmentPayload, findMatchingRule, COURIER_NAMES } from '../../../../lib/couriers/index';
import * as inpost from '../../../../lib/couriers/inpost';
import * as dhl from '../../../../lib/couriers/dhl';
import * as ups from '../../../../lib/couriers/ups';

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

// GET - List shipments
export async function GET(request) {
  try {
    await initDatabase();
    const { searchParams } = new URL(request.url);

    const filters = {
      courier: searchParams.get('courier'),
      status: searchParams.get('status'),
      limit: parseInt(searchParams.get('limit')) || 100,
      offset: parseInt(searchParams.get('offset')) || 0
    };

    const shipments = await getShipments(filters);

    return Response.json({ success: true, shipments });
  } catch (error) {
    console.error('Error fetching shipments:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Create shipment for order
export async function POST(request) {
  try {
    const hasAccess = await checkAccess();
    if (!hasAccess) {
      return Response.json({ success: false, error: 'Brak dostepu' }, { status: 403 });
    }

    await initDatabase();
    const body = await request.json();
    const { order_id, courier, options = {} } = body;

    if (!order_id) {
      return Response.json({ success: false, error: 'Brak order_id' }, { status: 400 });
    }

    // Get order data
    const { rows: orders } = await sql`SELECT * FROM orders WHERE id = ${order_id}`;
    if (orders.length === 0) {
      return Response.json({ success: false, error: 'Zamowienie nie znalezione' }, { status: 404 });
    }

    const order = orders[0];
    const shipping = order.shipping || order.customer || {};

    // Determine courier (from request or rules)
    let selectedCourier = courier;
    let selectedService = options.service_type;

    if (!selectedCourier) {
      const rule = await findMatchingRule({
        channel_label: order.channel_label,
        shipping,
        customer: order.customer
      });

      if (rule) {
        selectedCourier = rule.courier;
        selectedService = rule.service_type;
      } else {
        return Response.json({ success: false, error: 'Brak pasujacych regul kuriera' }, { status: 400 });
      }
    }

    // Create shipment payload
    const shipmentData = createShipmentPayload({
      id: order.id,
      externalId: order.external_id,
      shipping,
      customer: order.customer
    }, {
      weight: options.weight || 1,
      dimensions: options.dimensions,
      service_type: selectedService
    });

    // Create shipment with appropriate courier
    let result;
    if (selectedCourier === 'inpost') {
      result = await inpost.createShipment(shipmentData, { service: selectedService, ...options });
    } else if (selectedCourier === 'dhl_parcel') {
      result = await dhl.createShipment(shipmentData, { courier_type: 'dhl_parcel', product: selectedService, ...options });
    } else if (selectedCourier === 'dhl_express') {
      result = await dhl.createShipment(shipmentData, { courier_type: 'dhl_express', product: selectedService, ...options });
    } else if (selectedCourier === 'ups') {
      result = await ups.createShipment(shipmentData, { service: selectedService, ...options });
    } else {
      return Response.json({ success: false, error: `Nieobslugiwany kurier: ${selectedCourier}` }, { status: 400 });
    }

    return Response.json({
      success: true,
      shipment: result.shipment,
      courier: COURIER_NAMES[selectedCourier] || selectedCourier
    });
  } catch (error) {
    console.error('Error creating shipment:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
