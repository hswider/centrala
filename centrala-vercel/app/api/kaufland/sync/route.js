import { NextResponse } from 'next/server';
import {
  initDatabase,
  saveKauflandTicket,
  saveKauflandMessage,
  getKauflandSyncStatus,
  updateKauflandSyncStatus,
  setKauflandSyncInProgress
} from '../../../../lib/db';
import {
  isAuthenticated,
  getTickets,
  getTicketMessages,
  parseTicket,
  parseTicketMessage,
  KAUFLAND_STOREFRONTS
} from '../../../../lib/kaufland';

// POST - Sync tickets from Kaufland
export async function POST(request) {
  try {
    await initDatabase();

    // Check authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Kaufland API not configured',
        requiresAuth: true
      }, { status: 401 });
    }

    // Check if sync is already in progress
    const syncStatus = await getKauflandSyncStatus();
    if (syncStatus?.sync_in_progress) {
      return NextResponse.json({
        success: false,
        error: 'Sync already in progress'
      }, { status: 409 });
    }

    // Set sync in progress
    await setKauflandSyncInProgress(true);

    let syncedTickets = 0;
    let syncedMessages = 0;

    try {
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '30'); // max 30

      // All possible ticket statuses
      const allStatuses = ['opened', 'buyer_closed', 'seller_closed', 'both_closed', 'customer_service_closed_final'];

      // Collect tickets from all statuses
      let allTickets = [];
      for (const status of allStatuses) {
        try {
          const ticketsResponse = await getTickets(status, null, limit, 0);
          const tickets = ticketsResponse.data || [];
          allTickets = allTickets.concat(tickets);
        } catch (e) {
          console.log(`No tickets with status ${status}`);
        }
      }

      const tickets = allTickets;

      for (const ticketData of tickets) {
        try {
          // Parse ticket data
          const ticket = parseTicket(ticketData);

          // Save ticket to database
          await saveKauflandTicket(ticket);
          syncedTickets++;

          // Get messages for this ticket
          try {
            const messagesResponse = await getTicketMessages(ticket.id);
            const messages = messagesResponse.data || [];

            for (const msgData of messages) {
              const message = parseTicketMessage(msgData);
              await saveKauflandMessage(message, ticket.id);
              syncedMessages++;
            }
          } catch (msgError) {
            console.error(`Error fetching messages for ticket ${ticket.id}:`, msgError.message);
          }
        } catch (ticketError) {
          console.error(`Error syncing ticket:`, ticketError.message);
        }
      }

      // Update sync status
      await updateKauflandSyncStatus();

      return NextResponse.json({
        success: true,
        syncedTickets,
        syncedMessages
      });
    } finally {
      // Always clear sync in progress flag
      await setKauflandSyncInProgress(false);
    }
  } catch (error) {
    console.error('Kaufland sync error:', error);

    // Try to clear sync in progress flag
    try {
      await setKauflandSyncInProgress(false);
    } catch (e) {
      console.error('Failed to clear sync flag:', e.message);
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET - Get sync status or trigger sync (for cron)
export async function GET(request) {
  try {
    await initDatabase();

    // Check if this is a cron request
    const isCron = request.headers.get('x-vercel-cron') === '1';
    const { searchParams } = new URL(request.url);
    const triggerSync = searchParams.get('sync') === 'true';

    if (isCron || triggerSync) {
      // Trigger sync
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        return NextResponse.json({
          success: false,
          error: 'Kaufland API not configured'
        }, { status: 401 });
      }

      const syncStatus = await getKauflandSyncStatus();
      if (syncStatus?.sync_in_progress) {
        return NextResponse.json({
          success: false,
          error: 'Sync already in progress'
        });
      }

      await setKauflandSyncInProgress(true);

      let syncedTickets = 0;
      let syncedMessages = 0;

      try {
        // All possible ticket statuses
        const allStatuses = ['opened', 'buyer_closed', 'seller_closed', 'both_closed', 'customer_service_closed_final'];

        // Collect tickets from all statuses
        let allTickets = [];
        for (const status of allStatuses) {
          try {
            const ticketsResponse = await getTickets(status, null, 30, 0);
            const statusTickets = ticketsResponse.data || [];
            allTickets = allTickets.concat(statusTickets);
          } catch (e) {
            console.log(`No tickets with status ${status}`);
          }
        }

        for (const ticketData of allTickets) {
          try {
            const ticket = parseTicket(ticketData);
            await saveKauflandTicket(ticket);
            syncedTickets++;

            try {
              const messagesResponse = await getTicketMessages(ticket.id);
              const messages = messagesResponse.data || [];

              for (const msgData of messages) {
                const message = parseTicketMessage(msgData);
                await saveKauflandMessage(message, ticket.id);
                syncedMessages++;
              }
            } catch (msgError) {
              console.error(`Error fetching messages for ticket ${ticket.id}:`, msgError.message);
            }
          } catch (ticketError) {
            console.error(`Error syncing ticket:`, ticketError.message);
          }
        }

        await updateKauflandSyncStatus();

        return NextResponse.json({
          success: true,
          syncedTickets,
          syncedMessages,
          triggeredBy: isCron ? 'cron' : 'manual'
        });
      } finally {
        await setKauflandSyncInProgress(false);
      }
    }

    // Default: just return status
    const syncStatus = await getKauflandSyncStatus();

    return NextResponse.json({
      success: true,
      lastSyncAt: syncStatus?.last_sync_at || null,
      syncInProgress: syncStatus?.sync_in_progress || false
    });
  } catch (error) {
    console.error('Get sync status error:', error);

    try {
      await setKauflandSyncInProgress(false);
    } catch (e) {}

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
