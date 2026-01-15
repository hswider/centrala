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

    // Test different endpoints
    if (test === 'endpoints') {
      const results = {};

      // Try different endpoints to find messages
      const endpoints = [
        `/tickets?status=both_closed&limit=1&embedded=messages`,
        `/tickets?status=both_closed&limit=1&embedded=ticket_messages`,
        `/ticket-messages?id_ticket=${ticketId || '00123707719'}`,
        `/ticket-messages?limit=10`,
        `/tickets/${ticketId || '00123707719'}`,
        `/tickets/${ticketId || '00123707719'}/messages`,
      ];

      for (const ep of endpoints) {
        results[ep] = await rawKauflandRequest(ep);
      }

      return NextResponse.json({ success: true, results });
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
