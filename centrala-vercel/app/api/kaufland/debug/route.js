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
          endpoint = `/tickets/messages?id_ticket=${ticketId || '00123702789'}&limit=30`;
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
        case 'compare-ids':
          // Compare ticket IDs between tickets and messages
          const { sql: sql3 } = await import('@vercel/postgres');
          const ticketIds = await sql3`SELECT DISTINCT id FROM kaufland_tickets LIMIT 20`;
          const messageTicketIds = await sql3`SELECT DISTINCT ticket_id FROM kaufland_messages LIMIT 20`;
          const messagesCount = await sql3`SELECT COUNT(*) as count FROM kaufland_messages`;
          const ticketsCount = await sql3`SELECT COUNT(*) as count FROM kaufland_tickets`;
          return NextResponse.json({
            success: true,
            ticketIds: ticketIds.rows.map(r => r.id),
            messageTicketIds: messageTicketIds.rows.map(r => r.ticket_id),
            ticketsCount: ticketsCount.rows[0].count,
            messagesCount: messagesCount.rows[0].count
          });
        case 'message-stats':
          // Check message counts by sender
          const { sql: sql4 } = await import('@vercel/postgres');
          const senderStats = await sql4`SELECT sender, COUNT(*) as count FROM kaufland_messages GROUP BY sender`;
          const isFromSellerStats = await sql4`SELECT is_from_seller, COUNT(*) as count FROM kaufland_messages GROUP BY is_from_seller`;
          return NextResponse.json({
            success: true,
            bySender: senderStats.rows,
            byIsFromSeller: isFromSellerStats.rows
          });
        case 'test-storefront':
          // Test storefront mapping
          const { getTicketWithMessages, parseTicket, STOREFRONT_TO_COUNTRY } = await import('../../../../lib/kaufland');
          const testTicketId = ticketId || '00123721829';
          try {
            const ticketWithMsgs = await getTicketWithMessages(testTicketId);
            const detail = ticketWithMsgs.data || ticketWithMsgs;
            const parsed = parseTicket({ id_ticket: testTicketId, storefront: detail.storefront });
            return NextResponse.json({
              success: true,
              rawStorefront: detail.storefront,
              parsedMarketplace: parsed.marketplace,
              mapping: STOREFRONT_TO_COUNTRY
            });
          } catch (e) {
            return NextResponse.json({ success: false, error: e.message });
          }
        case 'force-update-marketplace':
          // Force update marketplace for all tickets (only update marketplace, not storefront since it's integer)
          const { sql: sql5 } = await import('@vercel/postgres');
          const { getTicketWithMessages: getTWM, parseTicket: pT } = await import('../../../../lib/kaufland');
          const allTicketsDb = await sql5`SELECT id FROM kaufland_tickets`;
          const updates = [];
          for (const row of allTicketsDb.rows) {
            try {
              const twm = await getTWM(row.id);
              const det = twm.data || twm;
              if (det.storefront) {
                const pTicket = pT({ id_ticket: row.id, storefront: det.storefront });
                await sql5`UPDATE kaufland_tickets SET marketplace = ${pTicket.marketplace} WHERE id = ${row.id}`;
                updates.push({ id: row.id, marketplace: pTicket.marketplace, storefront: det.storefront });
              }
            } catch (e) {
              updates.push({ id: row.id, error: e.message });
            }
          }
          return NextResponse.json({ success: true, updates });
        case 'raw-message':
          // Get raw message from API to see format
          const rawMsgResp = await rawKauflandRequest('/tickets/messages?limit=3');
          return NextResponse.json({ success: true, rawMessages: rawMsgResp });
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
