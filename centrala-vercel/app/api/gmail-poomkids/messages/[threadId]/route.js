import { NextResponse } from 'next/server';
import {
  getThread,
  sendReply,
  sendReplyWithAttachments,
  markThreadAsRead as markThreadAsReadGmail,
  isAuthenticated,
  parseMessage
} from '../../../../../lib/gmail-poomkids';
import {
  initDatabase,
  getGmailPoomkidsThread,
  saveGmailPoomkidsMessage,
  saveGmailPoomkidsThread,
  markGmailPoomkidsThreadAsRead,
  getGmailPoomkidsTokens
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
        error: 'Not authenticated with Gmail POOMKIDS',
        requiresAuth: true
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh') === 'true';

    // If refresh requested, fetch from Gmail
    if (refresh) {
      try {
        const gmailThread = await getThread(threadId);
        const tokens = await getGmailPoomkidsTokens();
        const ourEmail = tokens?.email?.toLowerCase();

        if (gmailThread && gmailThread.messages) {
          // Parse first message to get thread info
          const firstMessage = parseMessage(gmailThread.messages[0]);
          const lastMessage = parseMessage(gmailThread.messages[gmailThread.messages.length - 1]);

          // Check if thread is unread
          const hasUnread = gmailThread.messages.some(m => m.labelIds?.includes('UNREAD'));

          // Save thread
          await saveGmailPoomkidsThread({
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

            await saveGmailPoomkidsMessage({
              id: parsed.id,
              fromEmail: parsed.fromEmail,
              fromName: parsed.fromName,
              to: parsed.to,
              subject: parsed.subject,
              bodyText: parsed.bodyText,
              bodyHtml: parsed.bodyHtml,
              sentAt: parsed.internalDate,
              isOutgoing,
              hasAttachments: parsed.hasAttachments,
              attachments: parsed.attachments
            }, threadId);
          }
        }
      } catch (refreshError) {
        console.error('Failed to refresh Gmail POOMKIDS messages:', refreshError.message);
      }
    }

    // Get thread with messages from database
    const data = await getGmailPoomkidsThread(threadId);

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
    console.error('Get Gmail POOMKIDS thread error:', error);
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
        error: 'Not authenticated with Gmail POOMKIDS',
        requiresAuth: true
      }, { status: 401 });
    }

    const body = await request.json();
    const { text, to, subject, attachments } = body;

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

    // Send reply via Gmail API (with or without attachments)
    let sentMessage;
    if (attachments && attachments.length > 0) {
      sentMessage = await sendReplyWithAttachments(threadId, to, subject || '', text?.trim() || '', attachments);
    } else {
      sentMessage = await sendReply(threadId, to, subject || '', text.trim());
    }

    // Refresh thread to get the sent message
    const gmailThread = await getThread(threadId);
    const tokens = await getGmailPoomkidsTokens();
    const ourEmail = tokens?.email?.toLowerCase();

    if (gmailThread && gmailThread.messages) {
      for (const msg of gmailThread.messages) {
        const parsed = parseMessage(msg);
        const isOutgoing = parsed.fromEmail.toLowerCase() === ourEmail;

        await saveGmailPoomkidsMessage({
          id: parsed.id,
          fromEmail: parsed.fromEmail,
          fromName: parsed.fromName,
          to: parsed.to,
          subject: parsed.subject,
          bodyText: parsed.bodyText,
          bodyHtml: parsed.bodyHtml,
          sentAt: parsed.internalDate,
          isOutgoing,
          hasAttachments: parsed.hasAttachments,
          attachments: parsed.attachments
        }, threadId);
      }
    }

    return NextResponse.json({
      success: true,
      message: sentMessage
    });
  } catch (error) {
    console.error('Send Gmail POOMKIDS message error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Mark thread as read
export async function PUT(request, { params }) {
  try {
    await initDatabase();

    const { threadId } = await params;

    // Check authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated with Gmail POOMKIDS',
        requiresAuth: true
      }, { status: 401 });
    }

    // Mark as read in Gmail
    try {
      await markThreadAsReadGmail(threadId);
    } catch (e) {
      console.error('Failed to mark as read in Gmail POOMKIDS:', e.message);
    }

    // Mark as read in database
    await markGmailPoomkidsThreadAsRead(threadId);

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
