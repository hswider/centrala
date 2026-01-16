import { NextResponse } from 'next/server';
import {
  initDatabase,
  saveGmailAmazonDeThread,
  saveGmailAmazonDeMessage,
  getGmailAmazonDeSyncStatus,
  updateGmailAmazonDeSyncStatus,
  setGmailAmazonDeSyncInProgress
} from '../../../../lib/db';
import {
  isAuthenticated,
  getThreadsList,
  getThread,
  parseMessage
} from '../../../../lib/gmail-amazon-de';

// Detect marketplace from email address
function detectMarketplace(email) {
  if (!email) return null;
  const emailLower = email.toLowerCase();

  // Check for marketplace domain patterns
  if (emailLower.includes('@marketplace.amazon.de') || emailLower.includes('.amazon.de')) return 'DE';
  if (emailLower.includes('@marketplace.amazon.fr') || emailLower.includes('.amazon.fr')) return 'FR';
  if (emailLower.includes('@marketplace.amazon.it') || emailLower.includes('.amazon.it')) return 'IT';
  if (emailLower.includes('@marketplace.amazon.es') || emailLower.includes('.amazon.es')) return 'ES';
  if (emailLower.includes('@marketplace.amazon.pl') || emailLower.includes('.amazon.pl')) return 'PL';
  if (emailLower.includes('@marketplace.amazon.nl') || emailLower.includes('.amazon.nl')) return 'NL';
  if (emailLower.includes('@marketplace.amazon.se') || emailLower.includes('.amazon.se')) return 'SE';
  if (emailLower.includes('@marketplace.amazon.com.be') || emailLower.includes('.amazon.com.be')) return 'BE';
  if (emailLower.includes('@marketplace.amazon.co.uk') || emailLower.includes('.amazon.co.uk')) return 'UK';
  if (emailLower.includes('@marketplace.amazon.com') || emailLower.includes('.amazon.com')) return 'US';

  // Fallback - check if it's any Amazon marketplace
  if (emailLower.includes('@marketplace.amazon')) return 'EU';

  return null;
}

// POST - Sync messages from Gmail
export async function POST(request) {
  try {
    await initDatabase();

    // Check authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Gmail Amazon DE not authenticated',
        requiresAuth: true
      }, { status: 401 });
    }

    // Check if sync is already in progress
    const syncStatus = await getGmailAmazonDeSyncStatus();
    if (syncStatus?.sync_in_progress) {
      return NextResponse.json({
        success: false,
        error: 'Sync already in progress'
      }, { status: 409 });
    }

    // Set sync in progress
    await setGmailAmazonDeSyncInProgress(true);

    let syncedThreads = 0;
    let syncedMessages = 0;

    try {
      // Get threads from Gmail (Amazon marketplace emails)
      const { searchParams } = new URL(request.url);
      const maxResults = parseInt(searchParams.get('maxResults') || '30');

      const threadsResponse = await getThreadsList(maxResults);
      const threads = threadsResponse.threads || [];

      for (const threadSummary of threads) {
        try {
          // Get full thread with messages
          const fullThread = await getThread(threadSummary.id);

          if (!fullThread.messages || fullThread.messages.length === 0) {
            continue;
          }

          // Parse first message to get thread metadata
          const firstMessage = parseMessage(fullThread.messages[0]);
          const lastMessage = parseMessage(fullThread.messages[fullThread.messages.length - 1]);

          // Check if thread has UNREAD label
          const hasUnread = fullThread.messages.some(m =>
            m.labelIds && m.labelIds.includes('UNREAD')
          );

          // Detect marketplace from sender email
          const marketplace = detectMarketplace(firstMessage.fromEmail);

          // Analyze messages to determine response status
          let hasSellerReply = false;
          let lastCustomerMessageAt = null;
          let lastMessageIsFromCustomer = true;

          for (const message of fullThread.messages) {
            const isOutgoing = message.labelIds && message.labelIds.includes('SENT');
            const msgDate = new Date(parseInt(message.internalDate)).toISOString();

            if (isOutgoing) {
              hasSellerReply = true;
            } else {
              lastCustomerMessageAt = msgDate;
            }
          }

          // Check if last message is from customer (needs response)
          const lastMsgIsOutgoing = fullThread.messages[fullThread.messages.length - 1].labelIds?.includes('SENT');
          const needsResponse = !lastMsgIsOutgoing;

          // Save thread
          await saveGmailAmazonDeThread({
            id: fullThread.id,
            orderId: firstMessage.orderId,
            asin: firstMessage.asin,
            buyerEmail: firstMessage.fromEmail,
            buyerName: firstMessage.fromName,
            subject: firstMessage.subject,
            snippet: lastMessage.snippet || fullThread.snippet,
            marketplace: marketplace,
            lastMessageAt: lastMessage.internalDate,
            unread: hasUnread,
            needsResponse,
            lastCustomerMessageAt,
            hasSellerReply
          });

          syncedThreads++;

          // Save all messages in thread
          for (const message of fullThread.messages) {
            const parsed = parseMessage(message);

            // Determine if message is outgoing (sent by seller)
            const isOutgoing = parsed.labelIds && parsed.labelIds.includes('SENT');

            await saveGmailAmazonDeMessage({
              id: parsed.id,
              sender: isOutgoing ? 'seller' : parsed.fromEmail,
              fromName: parsed.fromName,
              subject: parsed.subject,
              bodyText: parsed.bodyText,
              bodyHtml: parsed.bodyHtml,
              sentAt: parsed.internalDate,
              isOutgoing,
              hasAttachments: parsed.hasAttachments,
              attachments: parsed.attachments
            }, fullThread.id);

            syncedMessages++;
          }
        } catch (threadError) {
          console.error(`Error syncing thread ${threadSummary.id}:`, threadError.message);
        }
      }

      // Update sync status
      await updateGmailAmazonDeSyncStatus();

      return NextResponse.json({
        success: true,
        syncedThreads,
        syncedMessages
      });
    } finally {
      // Always clear sync in progress flag
      await setGmailAmazonDeSyncInProgress(false);
    }
  } catch (error) {
    console.error('Gmail Amazon DE sync error:', error);

    // Try to clear sync in progress flag
    try {
      await setGmailAmazonDeSyncInProgress(false);
    } catch (e) {
      console.error('Failed to clear sync flag:', e.message);
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET - Get sync status or trigger sync (for Vercel Cron)
export async function GET(request) {
  try {
    await initDatabase();

    // Check if this is a cron request (Vercel adds this header)
    const isCron = request.headers.get('x-vercel-cron') === '1';

    // Also check for manual trigger via query param
    const { searchParams } = new URL(request.url);
    const triggerSync = searchParams.get('sync') === 'true';

    if (isCron || triggerSync) {
      // Trigger sync
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        return NextResponse.json({
          success: false,
          error: 'Gmail Amazon not authenticated'
        }, { status: 401 });
      }

      const syncStatus = await getGmailAmazonDeSyncStatus();
      if (syncStatus?.sync_in_progress) {
        return NextResponse.json({
          success: false,
          error: 'Sync already in progress'
        });
      }

      await setGmailAmazonDeSyncInProgress(true);

      let syncedThreads = 0;
      let syncedMessages = 0;

      try {
        const threadsResponse = await getThreadsList(30);
        const threads = threadsResponse.threads || [];

        for (const threadSummary of threads) {
          try {
            const fullThread = await getThread(threadSummary.id);

            if (!fullThread.messages || fullThread.messages.length === 0) {
              continue;
            }

            const firstMessage = parseMessage(fullThread.messages[0]);
            const lastMessage = parseMessage(fullThread.messages[fullThread.messages.length - 1]);

            const hasUnread = fullThread.messages.some(m =>
              m.labelIds && m.labelIds.includes('UNREAD')
            );

            const marketplace = detectMarketplace(firstMessage.fromEmail);

            // Analyze messages to determine response status
            let hasSellerReply = false;
            let lastCustomerMessageAt = null;

            for (const message of fullThread.messages) {
              const isOutgoing = message.labelIds && message.labelIds.includes('SENT');
              const msgDate = new Date(parseInt(message.internalDate)).toISOString();

              if (isOutgoing) {
                hasSellerReply = true;
              } else {
                lastCustomerMessageAt = msgDate;
              }
            }

            const lastMsgIsOutgoing = fullThread.messages[fullThread.messages.length - 1].labelIds?.includes('SENT');
            const needsResponse = !lastMsgIsOutgoing;

            await saveGmailAmazonDeThread({
              id: fullThread.id,
              orderId: firstMessage.orderId,
              asin: firstMessage.asin,
              buyerEmail: firstMessage.fromEmail,
              buyerName: firstMessage.fromName,
              subject: firstMessage.subject,
              snippet: lastMessage.snippet || fullThread.snippet,
              marketplace: marketplace,
              lastMessageAt: lastMessage.internalDate,
              unread: hasUnread,
              needsResponse,
              lastCustomerMessageAt,
              hasSellerReply
            });

            syncedThreads++;

            for (const message of fullThread.messages) {
              const parsed = parseMessage(message);
              const isOutgoing = parsed.labelIds && parsed.labelIds.includes('SENT');

              await saveGmailAmazonDeMessage({
                id: parsed.id,
                sender: isOutgoing ? 'seller' : parsed.fromEmail,
                fromName: parsed.fromName,
                subject: parsed.subject,
                bodyText: parsed.bodyText,
                bodyHtml: parsed.bodyHtml,
                sentAt: parsed.internalDate,
                isOutgoing,
                hasAttachments: parsed.hasAttachments,
                attachments: parsed.attachments
              }, fullThread.id);

              syncedMessages++;
            }
          } catch (threadError) {
            console.error(`Error syncing thread ${threadSummary.id}:`, threadError.message);
          }
        }

        await updateGmailAmazonDeSyncStatus();

        return NextResponse.json({
          success: true,
          syncedThreads,
          syncedMessages,
          triggeredBy: isCron ? 'cron' : 'manual'
        });
      } finally {
        await setGmailAmazonDeSyncInProgress(false);
      }
    }

    // Default: just return status
    const syncStatus = await getGmailAmazonDeSyncStatus();

    return NextResponse.json({
      success: true,
      lastSyncAt: syncStatus?.last_sync_at || null,
      syncInProgress: syncStatus?.sync_in_progress || false
    });
  } catch (error) {
    console.error('Get sync status error:', error);

    try {
      await setGmailAmazonDeSyncInProgress(false);
    } catch (e) {}

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
