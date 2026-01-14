import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getAuthorizationUrl, getThread, getThreadMessages, getMessageThreads, isAuthenticated } from '../../../../lib/allegro';
import { getAllegroTokens } from '../../../../lib/db';

// GET - Debug Allegro configuration
export async function GET() {
  try {
    const clientId = process.env.ALLEGRO_CLIENT_ID;
    const clientSecret = process.env.ALLEGRO_CLIENT_SECRET;
    const redirectUri = process.env.ALLEGRO_REDIRECT_URI || 'https://centrala-poom.vercel.app/api/allegro/callback';

    const authUrl = getAuthorizationUrl();
    const tokens = await getAllegroTokens();

    // Check order IDs in both tables
    const threadsWithOrders = await sql`
      SELECT id, order_id, interlocutor_login, interlocutor_name, offer_title
      FROM allegro_threads
      WHERE order_id IS NOT NULL
      LIMIT 5
    `;

    // All threads (to see what data we have)
    const allThreads = await sql`
      SELECT id, order_id, interlocutor_login, interlocutor_name, offer_title
      FROM allegro_threads
      ORDER BY last_message_at DESC
      LIMIT 5
    `;

    const allegroOrders = await sql`
      SELECT id, external_id, channel_platform, channel_label, customer
      FROM orders
      WHERE channel_platform ILIKE '%allegro%' OR channel_label ILIKE '%allegro%'
      ORDER BY ordered_at DESC
      LIMIT 5
    `;

    return NextResponse.json({
      config: {
        clientId: clientId ? `${clientId.substring(0, 8)}...` : 'NOT SET',
        clientIdLength: clientId?.length || 0,
        clientIdFormat: clientId ? (clientId.includes('-') ? 'UUID' : 'Other') : 'N/A',
        clientSecretSet: !!clientSecret,
        clientSecretLength: clientSecret?.length || 0,
        redirectUri,
        clientIdHasSpaces: clientId?.includes(' ') || false,
        clientIdHasNewline: clientId?.includes('\n') || clientId?.includes('\r') || false,
        clientSecretHasSpaces: clientSecret?.includes(' ') || false,
        clientSecretHasNewline: clientSecret?.includes('\n') || clientSecret?.includes('\r') || false,
      },
      authUrl,
      tokensExist: !!(tokens?.access_token),
      tokensExpireAt: tokens?.expires_at ? new Date(parseInt(tokens.expires_at)).toISOString() : null,
      orderMapping: {
        threadsWithOrderId: threadsWithOrders.rows,
        allThreads: allThreads.rows,
        allegroOrdersInDb: allegroOrders.rows,
        // Fetch raw thread data from Allegro API
        rawThreadFromApi: await (async () => {
          try {
            if (await isAuthenticated()) {
              // Get threads list from API
              const threadsResponse = await getMessageThreads(5, 0);
              const threads = threadsResponse.threads || [];

              // Get messages for first thread
              let firstThreadMessages = null;
              if (threads.length > 0) {
                const messagesResponse = await getThreadMessages(threads[0].id, 3);
                firstThreadMessages = messagesResponse.messages || [];
              }

              return {
                threadsFromApi: threads,
                firstThreadMessages
              };
            }
            return null;
          } catch (e) {
            return { error: e.message };
          }
        })()
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
