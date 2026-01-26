import { NextResponse } from 'next/server';
import {
  initDatabase,
  getGmailAmazonDeThread,
  saveGmailAmazonDeMessage,
  markGmailAmazonDeThreadAsRead,
  markGmailAmazonDeThreadResponded
} from '../../../../../lib/db';
import {
  isAuthenticated,
  getThread,
  sendReply,
  sendReplyWithAttachments,
  parseMessage,
  markThreadAsRead
} from '../../../../../lib/gmail-amazon-de';

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
        error: 'Gmail Amazon DE not authenticated',
        requiresAuth: true
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh') === 'true';

    // If refresh requested, fetch fresh data from Gmail
    if (refresh) {
      try {
        const gmailThread = await getThread(threadId);
        // Could update database here with fresh messages
        console.log('Refreshed Gmail thread:', threadId);
      } catch (refreshError) {
        console.error('Failed to refresh Gmail thread:', refreshError.message);
      }
    }

    // Get thread with messages from database
    const data = await getGmailAmazonDeThread(threadId);

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
    console.error('Get Gmail Amazon DE thread error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Send reply
export async function POST(request, { params }) {
  try {
    await initDatabase();

    const { threadId } = await params;

    // Check authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Gmail Amazon DE not authenticated',
        requiresAuth: true
      }, { status: 401 });
    }

    const body = await request.json();
    const { text, to, subject, attachments } = body;

    if (!text || text.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'Message text is required'
      }, { status: 400 });
    }

    if (!to) {
      return NextResponse.json({
        success: false,
        error: 'Recipient email is required'
      }, { status: 400 });
    }

    // Get thread first to find the last message's Message-ID for proper threading
    const threadForReply = await getThread(threadId);
    let lastMessageId = null;
    if (threadForReply && threadForReply.messages && threadForReply.messages.length > 0) {
      const lastMsg = threadForReply.messages[threadForReply.messages.length - 1];
      const headers = lastMsg.payload?.headers || [];
      const msgIdHeader = headers.find(h => h.name.toLowerCase() === 'message-id');
      lastMessageId = msgIdHeader?.value || null;
    }

    // Send reply via Gmail API (with or without attachments)
    let result;
    if (attachments && attachments.length > 0) {
      result = await sendReplyWithAttachments(
        threadId,
        to,
        subject || 'Re: Your Amazon Order',
        text.trim(),
        attachments,
        lastMessageId
      );
    } else {
      result = await sendReply(threadId, to, subject || 'Re: Your Amazon Order', text.trim(), lastMessageId);
    }

    // Save the sent message to database
    const sentMessage = {
      id: result.id || `${threadId}-sent-${Date.now()}`,
      sender: 'seller',
      subject: subject || 'Re: Your Amazon Order',
      bodyText: text.trim(),
      sentAt: new Date().toISOString(),
      isOutgoing: true,
      hasAttachments: attachments && attachments.length > 0,
      attachments: attachments ? attachments.map(a => ({
        filename: a.filename,
        mimeType: a.mimeType,
        size: a.data ? Math.floor(a.data.length * 0.75) : 0 // Approximate size from base64
      })) : []
    };

    await saveGmailAmazonDeMessage(sentMessage, threadId);

    // Mark thread as responded
    await markGmailAmazonDeThreadResponded(threadId);

    return NextResponse.json({
      success: true,
      message: sentMessage,
      gmailResponse: result
    });
  } catch (error) {
    console.error('Send Gmail Amazon DE message error:', error);
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
        error: 'Gmail Amazon DE not authenticated',
        requiresAuth: true
      }, { status: 401 });
    }

    // Mark as read in Gmail
    try {
      await markThreadAsRead(threadId);
    } catch (e) {
      console.error('Failed to mark as read in Gmail:', e.message);
    }

    // Mark as read in database
    await markGmailAmazonDeThreadAsRead(threadId);

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
