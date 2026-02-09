import { initDatabase } from '../../../../../lib/db';
import { sql } from '@vercel/postgres';
import * as inpost from '../../../../../lib/couriers/inpost';
import * as dhl from '../../../../../lib/couriers/dhl';
import * as ups from '../../../../../lib/couriers/ups';

// GET - Get shipment label
export async function GET(request, { params }) {
  try {
    await initDatabase();

    const { courier } = await params;
    const { searchParams } = new URL(request.url);
    const shipmentId = searchParams.get('shipment_id');
    const trackingNumber = searchParams.get('tracking');
    const format = searchParams.get('format') || 'pdf';

    if (!shipmentId && !trackingNumber) {
      return Response.json({ success: false, error: 'Brak shipment_id lub tracking' }, { status: 400 });
    }

    // First check if we have label data in database
    let query;
    if (shipmentId) {
      query = await sql`SELECT * FROM shipments WHERE courier_shipment_id = ${shipmentId} OR id = ${parseInt(shipmentId) || 0}`;
    } else {
      query = await sql`SELECT * FROM shipments WHERE tracking_number = ${trackingNumber}`;
    }

    const localShipment = query.rows[0];

    // If we have cached label data, return it
    if (localShipment?.label_data) {
      return Response.json({
        success: true,
        label: {
          data: localShipment.label_data,
          contentType: 'application/pdf'
        },
        tracking_number: localShipment.tracking_number,
        from_cache: true
      });
    }

    // Otherwise fetch from courier API
    let labelResult;
    const courierShipmentId = localShipment?.courier_shipment_id || shipmentId;

    if (courier === 'inpost') {
      labelResult = await inpost.getLabel(courierShipmentId, format);
    } else if (courier === 'dhl_parcel') {
      labelResult = await dhl.getParcelLabel(courierShipmentId);
    } else if (courier === 'dhl_express') {
      // DHL Express returns label with shipment, try recovery
      labelResult = { data: localShipment?.label_data, contentType: 'application/pdf' };
    } else if (courier === 'ups') {
      labelResult = await ups.getLabel(trackingNumber || localShipment?.tracking_number);
    } else {
      return Response.json({ success: false, error: `Nieprawidlowy kurier: ${courier}` }, { status: 400 });
    }

    // Cache the label if we have a local shipment
    if (localShipment && labelResult?.data && !localShipment.label_data) {
      await sql`
        UPDATE shipments
        SET label_data = ${labelResult.data}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${localShipment.id}
      `;
    }

    return Response.json({
      success: true,
      label: labelResult,
      tracking_number: localShipment?.tracking_number || trackingNumber,
      from_cache: false
    });
  } catch (error) {
    console.error('Error getting label:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Download label as file
export async function POST(request, { params }) {
  try {
    await initDatabase();

    const { courier } = await params;
    const body = await request.json();
    const { shipment_id, tracking } = body;

    // Get label data
    const labelResponse = await GET(
      new Request(`http://localhost/api/couriers/${courier}/label?shipment_id=${shipment_id || ''}&tracking=${tracking || ''}`),
      { params: Promise.resolve({ courier }) }
    );

    const labelData = await labelResponse.json();

    if (!labelData.success || !labelData.label?.data) {
      return Response.json({ success: false, error: 'Nie udalo sie pobrac etykiety' }, { status: 400 });
    }

    // Return as downloadable PDF
    const buffer = Buffer.from(labelData.label.data, 'base64');

    return new Response(buffer, {
      headers: {
        'Content-Type': labelData.label.contentType || 'application/pdf',
        'Content-Disposition': `attachment; filename="label-${tracking || shipment_id}.pdf"`,
        'Content-Length': buffer.length.toString()
      }
    });
  } catch (error) {
    console.error('Error downloading label:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
