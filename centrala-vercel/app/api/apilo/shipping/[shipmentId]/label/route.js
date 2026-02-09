import { getShipmentLabel } from '../../../../../../lib/apilo';

// GET - Download shipment label
export async function GET(request, { params }) {
  try {
    const { shipmentId } = await params;

    if (!shipmentId) {
      return Response.json({ success: false, error: 'Missing shipmentId' }, { status: 400 });
    }

    const label = await getShipmentLabel(shipmentId);

    if (!label) {
      return Response.json({ success: false, error: 'Label not found' }, { status: 404 });
    }

    // If label is base64 encoded, return as PDF
    if (label.content) {
      const buffer = Buffer.from(label.content, 'base64');
      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="label-${shipmentId}.pdf"`,
          'Content-Length': buffer.length.toString()
        }
      });
    }

    // Return label data as JSON
    return Response.json({ success: true, label });
  } catch (error) {
    console.error('Error getting label:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
