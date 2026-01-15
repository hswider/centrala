import { NextResponse } from 'next/server';
import {
  initDatabase,
  getAmazonDeThread,
  saveAmazonDeMessage,
  markAmazonDeThreadAsRead
} from '../../../../../lib/db';
import {
  isAuthenticated,
  getOrder,
  getOrderItems,
  getMessagingActions,
  sendUnexpectedProblemMessage
} from '../../../../../lib/amazon-de';

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
        error: 'Amazon DE credentials not configured',
        requiresAuth: true
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh') === 'true';

    // If refresh requested, fetch fresh order data from Amazon
    if (refresh) {
      try {
        const order = await getOrder(threadId);
        const items = await getOrderItems(threadId);

        // Could update thread with fresh data here if needed
        console.log('Refreshed order data:', order?.AmazonOrderId);
      } catch (refreshError) {
        console.error('Failed to refresh Amazon order:', refreshError.message);
      }
    }

    // Get thread with messages from database
    const data = await getAmazonDeThread(threadId);

    if (!data) {
      return NextResponse.json({
        success: false,
        error: 'Thread not found'
      }, { status: 404 });
    }

    // Get available messaging actions for this order
    let messagingActions = null;
    try {
      messagingActions = await getMessagingActions(threadId);
    } catch (e) {
      console.error('Could not get messaging actions:', e.message);
    }

    return NextResponse.json({
      success: true,
      ...data,
      messagingActions
    });
  } catch (error) {
    console.error('Get Amazon DE thread error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Send reply to buyer
export async function POST(request, { params }) {
  try {
    await initDatabase();

    const { threadId } = await params;

    // Check authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Amazon DE credentials not configured',
        requiresAuth: true
      }, { status: 401 });
    }

    const body = await request.json();
    const { text, messageType = 'unexpectedProblem' } = body;

    if (!text || text.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'Message text is required'
      }, { status: 400 });
    }

    // Send message via Amazon Messaging API
    // Note: Amazon has strict rules about when you can message buyers
    // The "unexpectedProblem" type is for contacting buyers about issues
    let result;
    try {
      result = await sendUnexpectedProblemMessage(threadId, text.trim());
    } catch (sendError) {
      console.error('Failed to send Amazon message:', sendError.message);
      return NextResponse.json({
        success: false,
        error: `Failed to send message: ${sendError.message}. Amazon restricts when sellers can contact buyers.`
      }, { status: 400 });
    }

    // Save the sent message to database
    const sentMessage = {
      id: `${threadId}-sent-${Date.now()}`,
      sender: 'seller',
      subject: 'Message to buyer',
      bodyText: text.trim(),
      sentAt: new Date().toISOString(),
      isOutgoing: true,
    };

    await saveAmazonDeMessage(sentMessage, threadId);

    return NextResponse.json({
      success: true,
      message: sentMessage,
      amazonResponse: result
    });
  } catch (error) {
    console.error('Send Amazon DE message error:', error);
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
        error: 'Amazon DE credentials not configured',
        requiresAuth: true
      }, { status: 401 });
    }

    await markAmazonDeThreadAsRead(threadId);

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
