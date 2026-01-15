import { NextResponse } from 'next/server';
import crypto from 'crypto';

const KAUFLAND_API_BASE = 'https://sellerapi.kaufland.com/v2';

function generateSignature(method, uri, body, timestamp, secretKey) {
  const stringToSign = [method, uri, body, timestamp.toString()].join("\n");
  return crypto.createHmac('sha256', secretKey).update(stringToSign).digest('hex');
}

async function rawKauflandRequest(endpoint) {
  const clientKey = process.env.KAUFLAND_CLIENT_KEY;
  const secretKey = process.env.KAUFLAND_SECRET_KEY;
  const uri = `${KAUFLAND_API_BASE}${endpoint}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = generateSignature('GET', uri, '', timestamp, secretKey);

  const response = await fetch(uri, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Shop-Client-Key': clientKey,
      'Shop-Timestamp': timestamp.toString(),
      'Shop-Signature': signature,
    },
  });

  return {
    status: response.status,
    ok: response.ok,
    data: response.ok ? await response.json() : await response.text()
  };
}

export async function GET(request) {
  try {
    const clientKey = process.env.KAUFLAND_CLIENT_KEY;
    const secretKey = process.env.KAUFLAND_SECRET_KEY;
    if (!clientKey || !secretKey) {
      return NextResponse.json({ success: false, error: 'Not configured' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('ticketId');
    const test = searchParams.get('test');

    // Test specific endpoint
    if (test) {
      let endpoint;
      switch(test) {
        case 'messages':
          endpoint = `/ticket-messages?id_ticket=${ticketId || '00123707719'}`;
          break;
        case 'messages2':
          endpoint = `/ticket-messages?limit=10`;
          break;
        case 'ticket':
          endpoint = `/tickets/${ticketId || '00123707719'}`;
          break;
        case 'ticket-msg':
          endpoint = `/tickets/${ticketId || '00123707719'}/messages`;
          break;
        case 'claims':
          endpoint = `/claims?limit=10`;
          break;
        case 'claim-messages':
          endpoint = `/claim-messages?id_claim=${ticketId || '00123707719'}`;
          break;
        default:
          endpoint = test;
      }
      const result = await rawKauflandRequest(endpoint);
      return NextResponse.json({ success: true, endpoint, result });
    }

    // Default: get tickets with embedded parameter
    const response = await rawKauflandRequest(`/tickets?status=both_closed&limit=5&embedded=messages`);

    return NextResponse.json({
      success: true,
      response
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
