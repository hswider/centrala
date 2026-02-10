import { getShipmentLabel, apiloRequestDirect } from '../../../../../../lib/apilo';

// GET - Download shipment label
export async function GET(request, { params }) {
  try {
    const { shipmentId } = await params;

    if (!shipmentId) {
      return Response.json({ success: false, error: 'Missing shipmentId' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const debug = searchParams.get('debug') === 'true';

    // Try multiple label endpoint patterns
    const endpoints = [
      `/rest/api/shipping/shipment/${shipmentId}/label/`,
      `/rest/api/shipping/shipment/${shipmentId}/labels/`,
      `/rest/api/shipping/label/${shipmentId}/`,
    ];

    let label = null;
    let lastError = null;
    let debugInfo = [];

    for (const endpoint of endpoints) {
      try {
        const data = await apiloRequestDirect('GET', endpoint);
        debugInfo.push({ endpoint, status: 'ok', dataKeys: data ? Object.keys(data) : null, dataType: typeof data });
        if (data) {
          label = data;
          break;
        }
      } catch (e) {
        lastError = e;
        debugInfo.push({ endpoint, error: e.message, status: e.response?.status });
      }
    }

    if (debug) {
      return Response.json({ shipmentId, debugInfo, label: label ? Object.keys(label) : null });
    }

    if (!label) {
      return Response.json({
        success: false,
        error: 'Label not found',
        shipmentId,
        tried: debugInfo
      }, { status: 404 });
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

    // If label has a file/url field, try to fetch it
    if (label.file || label.url || label.labelUrl) {
      const labelUrl = label.file || label.url || label.labelUrl;
      const pdfRes = await fetch(labelUrl);
      if (pdfRes.ok) {
        const buffer = await pdfRes.arrayBuffer();
        return new Response(buffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="label-${shipmentId}.pdf"`
          }
        });
      }
    }

    // Return label data as JSON for inspection
    return Response.json({ success: true, label });
  } catch (error) {
    console.error('Error getting label:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
