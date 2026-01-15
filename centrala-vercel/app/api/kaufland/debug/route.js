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
        case 'all-messages':
          endpoint = `/tickets/messages?limit=10`;
          break;
        case 'ticket-messages-filter':
          endpoint = `/tickets/messages?id_ticket=${ticketId || '00123702789'}&limit=50`;
          break;
        case 'db-messages':
          // Check messages in database
          const { sql } = await import('@vercel/postgres');
          const dbMessages = await sql`SELECT * FROM kaufland_messages ORDER BY created_at DESC LIMIT 10`;
          return NextResponse.json({ success: true, dbMessages: dbMessages.rows });
        case 'db-tickets':
          const { sql: sql2 } = await import('@vercel/postgres');
          const dbTickets = await sql2`SELECT id, status, marketplace FROM kaufland_tickets ORDER BY updated_at DESC LIMIT 10`;
          return NextResponse.json({ success: true, dbTickets: dbTickets.rows });
        case 'test-save':
          // Test saving a message
          const { getAllMessages, parseTicketMessage } = await import('../../../../lib/kaufland');
          const { saveKauflandMessage } = await import('../../../../lib/db');
          try {
            const msgResp = await getAllMessages(5, 0);
            const msgs = msgResp.data || [];
            const results = [];
            for (const m of msgs) {
              const parsed = parseTicketMessage(m);
              try {
                await saveKauflandMessage(parsed, parsed.ticketId);
                results.push({ id: parsed.id, ticketId: parsed.ticketId, status: 'saved' });
              } catch (e) {
                results.push({ id: parsed.id, ticketId: parsed.ticketId, status: 'error', error: e.message });
              }
            }
            return NextResponse.json({ success: true, results, rawMsgs: msgs.slice(0, 2) });
          } catch (e) {
            return NextResponse.json({ success: false, error: e.message });
          }
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
