import { NextResponse } from 'next/server';
import {
  initDatabase,
  saveKauflandTicket,
  saveKauflandMessage,
  getKauflandSyncStatus,
  updateKauflandSyncStatus,
  setKauflandSyncInProgress,
  getKauflandOpenTicketIds
} from '../../../../lib/db';
import {
  isAuthenticated,
  getTickets,
  getTicketWithMessages,
  parseTicket,
  parseTicketMessage,
  KAUFLAND_STOREFRONTS
} from '../../../../lib/kaufland';

// Helper to sync a single ticket with its messages
async function syncTicketWithMessages(ticketData) {
  let ticket = parseTicket(ticketData);
  let messagesCount = 0;

  try {
    const ticketWithMessages = await getTicketWithMessages(ticket.id);
    const ticketDetail = ticketWithMessages.data || ticketWithMessages;

    // Update ticket with storefront from detailed response
    if (ticketDetail.storefront) {
      ticket = parseTicket({ ...ticketData, storefront: ticketDetail.storefront });
    }

    // Save ticket
    await saveKauflandTicket(ticket);

    // Save messages
    const messages = ticketDetail.messages || [];
    for (const msgData of messages) {
      try {
        const message = parseTicketMessage(msgData);
        await saveKauflandMessage(message, ticket.id);
        messagesCount++;
      } catch (msgError) {
        console.error(`Error saving message for ticket ${ticket.id}:`, msgError.message);
      }
    }
  } catch (err) {
    // If fetching details fails, save basic ticket anyway
    await saveKauflandTicket(ticket);
    console.error(`Error fetching details for ticket ${ticket.id}:`, err.message);
  }

  return { ticket, messagesCount };
}

// POST - Full sync (manual) - syncs all tickets
export async function POST(request) {
  try {
    await initDatabase();

    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Kaufland API not configured',
        requiresAuth: true
      }, { status: 401 });
    }

    const syncStatus = await getKauflandSyncStatus();
    if (syncStatus?.sync_in_progress) {
      return NextResponse.json({
        success: false,
        error: 'Sync already in progress'
      }, { status: 409 });
    }

    await setKauflandSyncInProgress(true);

    let syncedTickets = 0;
    let syncedMessages = 0;

    try {
      const { searchParams } = new URL(request.url);
      const fullSync = searchParams.get('full') === 'true';

      if (fullSync) {
        // Full sync - all statuses, more tickets per status
        const allStatuses = ['opened', 'buyer_closed', 'seller_closed', 'both_closed'];

        for (const status of allStatuses) {
          try {
            const ticketsResponse = await getTickets(status, null, 50, 0);
            const tickets = ticketsResponse.data || [];

            for (const ticketData of tickets) {
              try {
                const result = await syncTicketWithMessages(ticketData);
                syncedTickets++;
                syncedMessages += result.messagesCount;
              } catch (e) {
                console.error(`Error syncing ticket:`, e.message);
              }
            }
          } catch (e) {
            console.log(`No tickets with status ${status}`);
          }
        }
      } else {
        // Normal sync - only opened tickets + recently active
        // This is faster and suitable for frequent syncs

        // 1. Sync all opened tickets (needs response)
        try {
          const openedResponse = await getTickets('opened', null, 30, 0);
          const openedTickets = openedResponse.data || [];

          for (const ticketData of openedTickets) {
            try {
              const result = await syncTicketWithMessages(ticketData);
              syncedTickets++;
              syncedMessages += result.messagesCount;
            } catch (e) {
              console.error(`Error syncing opened ticket:`, e.message);
            }
          }
        } catch (e) {
          console.log('No opened tickets');
        }

        // 2. Sync buyer_closed tickets (buyer responded, may need action)
        try {
          const buyerClosedResponse = await getTickets('buyer_closed', null, 20, 0);
          const buyerClosedTickets = buyerClosedResponse.data || [];

          for (const ticketData of buyerClosedTickets) {
            try {
              const result = await syncTicketWithMessages(ticketData);
              syncedTickets++;
              syncedMessages += result.messagesCount;
            } catch (e) {
              console.error(`Error syncing buyer_closed ticket:`, e.message);
            }
          }
        } catch (e) {
          console.log('No buyer_closed tickets');
        }

        // 3. Check tickets that are open in our DB but might have been updated
        try {
          const dbOpenTicketIds = await getKauflandOpenTicketIds();
          for (const ticketId of dbOpenTicketIds.slice(0, 20)) {
            try {
              const ticketWithMessages = await getTicketWithMessages(ticketId);
              const ticketDetail = ticketWithMessages.data || ticketWithMessages;
              const result = await syncTicketWithMessages(ticketDetail);
              syncedTickets++;
              syncedMessages += result.messagesCount;
            } catch (e) {
              // Ticket might be deleted or API error
              console.log(`Could not refresh ticket ${ticketId}`);
            }
          }
        } catch (e) {
          console.log('Error checking DB open tickets:', e.message);
        }
      }

      await updateKauflandSyncStatus();

      return NextResponse.json({
        success: true,
        syncedTickets,
        syncedMessages,
        mode: fullSync ? 'full' : 'incremental'
      });
    } finally {
      await setKauflandSyncInProgress(false);
    }
  } catch (error) {
    console.error('Kaufland sync error:', error);

    try {
      await setKauflandSyncInProgress(false);
    } catch (e) {}

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET - Get sync status or trigger incremental sync (for cron)
export async function GET(request) {
  try {
    await initDatabase();

    const isCron = request.headers.get('x-vercel-cron') === '1';
    const { searchParams } = new URL(request.url);
    const triggerSync = searchParams.get('sync') === 'true';

    if (isCron || triggerSync) {
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
        // INCREMENTAL SYNC for cron - only active tickets
        // 1. Opened tickets (needs response)
        try {
          const openedResponse = await getTickets('opened', null, 30, 0);
          const openedTickets = openedResponse.data || [];

          for (const ticketData of openedTickets) {
            try {
              const result = await syncTicketWithMessages(ticketData);
              syncedTickets++;
              syncedMessages += result.messagesCount;
            } catch (e) {
              console.error(`Error syncing opened ticket:`, e.message);
            }
          }
        } catch (e) {
          console.log('No opened tickets');
        }

        // 2. Buyer closed (buyer responded)
        try {
          const buyerClosedResponse = await getTickets('buyer_closed', null, 15, 0);
          const buyerClosedTickets = buyerClosedResponse.data || [];

          for (const ticketData of buyerClosedTickets) {
            try {
              const result = await syncTicketWithMessages(ticketData);
              syncedTickets++;
              syncedMessages += result.messagesCount;
            } catch (e) {
              console.error(`Error syncing buyer_closed ticket:`, e.message);
            }
          }
        } catch (e) {
          console.log('No buyer_closed tickets');
        }

        // 3. Seller closed (we responded, waiting)
        try {
          const sellerClosedResponse = await getTickets('seller_closed', null, 10, 0);
          const sellerClosedTickets = sellerClosedResponse.data || [];

          for (const ticketData of sellerClosedTickets) {
            try {
              const result = await syncTicketWithMessages(ticketData);
              syncedTickets++;
              syncedMessages += result.messagesCount;
            } catch (e) {
              console.error(`Error syncing seller_closed ticket:`, e.message);
            }
          }
        } catch (e) {
          console.log('No seller_closed tickets');
        }

        await updateKauflandSyncStatus();

        return NextResponse.json({
          success: true,
          syncedTickets,
          syncedMessages,
          triggeredBy: isCron ? 'cron' : 'manual',
          mode: 'incremental'
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
