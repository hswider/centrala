import { NextResponse } from 'next/server';
import {
  initDatabase,
  getGmailAmazonDeThread,
  saveGmailAmazonDeMessage,
  markGmailAmazonDeThreadAsRead
} from '../../../../../lib/db';
import {
  isAuthenticated,
  getThread,
  sendReply,
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
    const { text, to, subject } = body;

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

    // Send reply via Gmail API
    const result = await sendReply(threadId, to, subject || 'Re: Your Amazon Order', text.trim());

    // Save the sent message to database
    const sentMessage = {
      id: result.id || `${threadId}-sent-${Date.now()}`,
      sender: 'seller',
      subject: subject || 'Re: Your Amazon Order',
      bodyText: text.trim(),
      sentAt: new Date().toISOString(),
      isOutgoing: true,
    };

    await saveGmailAmazonDeMessage(sentMessage, threadId);

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
