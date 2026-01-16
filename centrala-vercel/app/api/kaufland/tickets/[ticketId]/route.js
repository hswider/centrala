import { NextResponse } from 'next/server';
import {
  initDatabase,
  getKauflandTicket,
  saveKauflandMessage,
  markKauflandTicketAsRead
} from '../../../../../lib/db';
import {
  isAuthenticated,
  getTicket,
  getTicketMessages,
  sendTicketMessage,
  parseTicketMessage
} from '../../../../../lib/kaufland';

// GET - Get ticket with messages
export async function GET(request, { params }) {
  try {
    await initDatabase();

    const { ticketId } = await params;

    // Check authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Kaufland API not configured',
        requiresAuth: true
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh') === 'true';

    // If refresh requested, fetch fresh data from Kaufland API
    if (refresh) {
      try {
        const messagesResponse = await getTicketMessages(ticketId);
        const messages = messagesResponse.data || [];

        for (const msg of messages) {
          const parsed = parseTicketMessage(msg);
          await saveKauflandMessage(parsed, ticketId);
        }

        console.log('Refreshed Kaufland ticket:', ticketId);
      } catch (refreshError) {
        console.error('Failed to refresh Kaufland ticket:', refreshError.message);
      }
    }

    // Get ticket with messages from database
    const data = await getKauflandTicket(ticketId);

    if (!data) {
      return NextResponse.json({
        success: false,
        error: 'Ticket not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ...data
    });
  } catch (error) {
    console.error('Get Kaufland ticket error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Send message to ticket (with optional attachments)
export async function POST(request, { params }) {
  try {
    await initDatabase();

    const { ticketId } = await params;

    // Check authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Kaufland API not configured',
        requiresAuth: true
      }, { status: 401 });
    }

    const body = await request.json();
    const { text, interimNotice = false, attachments = [] } = body;

    if (!text || text.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'Message text is required'
      }, { status: 400 });
    }

    // Send message via Kaufland API (with attachments if any)
    const result = await sendTicketMessage(ticketId, text.trim(), interimNotice, attachments);

    // Build text with attachment info for database
    let dbText = text.trim();
    if (attachments.length > 0) {
      const attachmentNames = attachments.map(a => a.filename).join(', ');
      dbText += `\n\n📎 Zalaczniki: ${attachmentNames}`;
    }

    // Save the sent message to database
    const sentMessage = {
      id: `${ticketId}-sent-${Date.now()}`,
      sender: 'seller',
      text: dbText,
      createdAt: new Date().toISOString(),
      isFromSeller: true,
    };

    await saveKauflandMessage(sentMessage, ticketId);

    return NextResponse.json({
      success: true,
      message: sentMessage,
      kauflandResponse: result,
      attachmentsSent: attachments.length
    });
  } catch (error) {
    console.error('Send Kaufland message error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Mark ticket as read
export async function PUT(request, { params }) {
  try {
    await initDatabase();

    const { ticketId } = await params;

    // Check authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Kaufland API not configured',
        requiresAuth: true
      }, { status: 401 });
    }

    // Mark as read in database
    await markKauflandTicketAsRead(ticketId);

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
