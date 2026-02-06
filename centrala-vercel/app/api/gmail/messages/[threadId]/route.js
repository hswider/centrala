import { NextResponse } from 'next/server';
import {
  getThread,
  sendReply,
  sendReplyWithAttachments,
  markThreadAsRead as markThreadAsReadGmail,
  isAuthenticated,
  parseMessage,
  isOutgoingMessage
} from '../../../../../lib/gmail';
import {
  initDatabase,
  getGmailThread,
  saveGmailMessage,
  saveGmailThread,
  markGmailThreadAsRead,
  updateGmailThreadStatus,
  deleteGmailMessages,
  getGmailTokens
} from '../../../../../lib/db';

// GET - Get thread with messages
export async function GET(request, { params }) {
  try {
    await initDatabase();

    const { threadId } = await params;

    // Check authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated with Gmail',
        requiresAuth: true
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh') === 'true';

    // If refresh requested, fetch from Gmail
    if (refresh) {
      try {
        const gmailThread = await getThread(threadId);
        const tokens = await getGmailTokens();
        const ourEmail = tokens?.email?.toLowerCase();

        if (gmailThread && gmailThread.messages) {
          // Parse first message to get thread info
          const firstMessage = parseMessage(gmailThread.messages[0]);
          const lastMessage = parseMessage(gmailThread.messages[gmailThread.messages.length - 1]);

          // Check if thread is unread
          const hasUnread = gmailThread.messages.some(m => m.labelIds?.includes('UNREAD'));

          // Save thread
          await saveGmailThread({
            id: threadId,
            subject: firstMessage.subject,
            snippet: gmailThread.snippet,
            fromEmail: firstMessage.fromEmail,
            fromName: firstMessage.fromName,
            lastMessageAt: lastMessage.internalDate,
            unread: hasUnread,
            messagesCount: gmailThread.messages.length,
            labels: lastMessage.labelIds
          });

          // Save messages
          for (const msg of gmailThread.messages) {
            const parsed = parseMessage(msg);
            const isOutgoing = parsed.fromEmail.toLowerCase() === ourEmail;

            await saveGmailMessage({
              id: parsed.id,
              fromEmail: parsed.fromEmail,
              fromName: parsed.fromName,
              to: parsed.to,
              cc: parsed.cc,
              subject: parsed.subject,
              bodyText: parsed.bodyText,
              bodyHtml: parsed.bodyHtml,
              sentAt: parsed.internalDate,
              isOutgoing,
              hasAttachments: parsed.hasAttachments || false,
              attachments: parsed.attachments || []
            }, threadId);
          }
        }
      } catch (refreshError) {
        console.error('Failed to refresh Gmail messages:', refreshError.message);
      }
    }

    // Get thread with messages from database
    const data = await getGmailThread(threadId);

    if (!data) {
      return NextResponse.json({
        success: false,
        error: 'Thread not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ...data
    });
  } catch (error) {
    console.error('Get Gmail thread error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Send reply to thread
export async function POST(request, { params }) {
  try {
    await initDatabase();

    const { threadId } = await params;

    // Check authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated with Gmail',
        requiresAuth: true
      }, { status: 401 });
    }

    const body = await request.json();
    const { text, to, cc, subject, attachments } = body;

    if ((!text || text.trim() === '') && (!attachments || attachments.length === 0)) {
      return NextResponse.json({
        success: false,
        error: 'Message text or attachments required'
      }, { status: 400 });
    }

    if (!to) {
      return NextResponse.json({
        success: false,
        error: 'Recipient email is required'
      }, { status: 400 });
    }

    // Get thread first to find ALL Message-IDs for proper threading
    const threadForReply = await getThread(threadId);
    let lastMessageId = null;
    let allMessageIds = [];
    if (threadForReply && threadForReply.messages && threadForReply.messages.length > 0) {
      // Collect all Message-IDs from the thread for the References header
      for (const msg of threadForReply.messages) {
        const headers = msg.payload?.headers || [];
        const msgIdHeader = headers.find(h => h.name.toLowerCase() === 'message-id');
        if (msgIdHeader?.value) {
          allMessageIds.push(msgIdHeader.value);
        }
      }
      // The last Message-ID is used for In-Reply-To
      lastMessageId = allMessageIds.length > 0 ? allMessageIds[allMessageIds.length - 1] : null;
    }

    // Send reply via Gmail API (with or without attachments)
    let sentMessage;
    if (attachments && attachments.length > 0) {
      sentMessage = await sendReplyWithAttachments(threadId, to, subject || '', text?.trim() || '', attachments, lastMessageId, allMessageIds, cc);
    } else {
      sentMessage = await sendReply(threadId, to, subject || '', text.trim(), lastMessageId, allMessageIds, cc);
    }

    // Refresh thread to get the sent message
    const gmailThread = await getThread(threadId);
    const tokens = await getGmailTokens();
    const ourEmail = tokens?.email?.toLowerCase();

    if (gmailThread && gmailThread.messages) {
      for (const msg of gmailThread.messages) {
        const parsed = parseMessage(msg);
        const isOutgoing = parsed.fromEmail.toLowerCase() === ourEmail;

        await saveGmailMessage({
          id: parsed.id,
          fromEmail: parsed.fromEmail,
          fromName: parsed.fromName,
          to: parsed.to,
          cc: parsed.cc,
          subject: parsed.subject,
          bodyText: parsed.bodyText,
          bodyHtml: parsed.bodyHtml,
          sentAt: parsed.internalDate,
          isOutgoing,
          hasAttachments: parsed.hasAttachments || false,
          attachments: parsed.attachments || []
        }, threadId);
      }
    }

    return NextResponse.json({
      success: true,
      message: sentMessage
    });
  } catch (error) {
    console.error('Send Gmail message error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Mark thread as read or update status
export async function PUT(request, { params }) {
  try {
    await initDatabase();

    const { threadId } = await params;

    // Check authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated with Gmail',
        requiresAuth: true
      }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { status } = body;

    // If status is provided, update it
    if (status) {
      const validStatuses = ['new', 'resolved', 'unresolved'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid status. Must be: new, resolved, or unresolved'
        }, { status: 400 });
      }

      await updateGmailThreadStatus(threadId, status);

      return NextResponse.json({
        success: true,
        status
      });
    }

    // Otherwise, mark as read (legacy behavior)
    try {
      await markThreadAsReadGmail(threadId);
    } catch (e) {
      console.error('Failed to mark as read in Gmail:', e.message);
    }

    await markGmailThreadAsRead(threadId);

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete specific messages from thread
export async function DELETE(request, { params }) {
  try {
    await initDatabase();

    const { threadId } = await params;

    const body = await request.json();
    const { messageIds } = body;

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'messageIds array is required'
      }, { status: 400 });
    }

    const deleted = await deleteGmailMessages(threadId, messageIds);

    return NextResponse.json({
      success: true,
      deletedCount: deleted
    });
  } catch (error) {
    console.error('Delete messages error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
