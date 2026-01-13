import { NextResponse } from 'next/server';
import {
  getThreadMessages,
  sendMessage,
  markThreadAsRead as markThreadAsReadAllegro,
  isAuthenticated
} from '../../../../../lib/allegro';
import {
  initDatabase,
  getAllegroThread,
  saveAllegroMessage,
  markAllegroThreadAsRead
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
        error: 'Not authenticated with Allegro',
        requiresAuth: true
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh') === 'true';

    // If refresh requested, fetch from Allegro
    if (refresh) {
      try {
        const messagesResponse = await getThreadMessages(threadId, 50);
        const messages = messagesResponse.messages || [];

        // Save messages to database
        for (const message of messages) {
          await saveAllegroMessage(message, threadId);
        }
      } catch (refreshError) {
        console.error('Failed to refresh messages:', refreshError.message);
      }
    }

    // Get thread with messages from database
    const data = await getAllegroThread(threadId);

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
    console.error('Get thread error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Send message to thread
export async function POST(request, { params }) {
  try {
    await initDatabase();

    const { threadId } = await params;

    // Check authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated with Allegro',
        requiresAuth: true
      }, { status: 401 });
    }

    const body = await request.json();
    const { text } = body;

    if (!text || text.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'Message text is required'
      }, { status: 400 });
    }

    // Send message via Allegro API
    const sentMessage = await sendMessage(threadId, text.trim());

    // Save to database
    await saveAllegroMessage(sentMessage, threadId);

    return NextResponse.json({
      success: true,
      message: sentMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
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
        error: 'Not authenticated with Allegro',
        requiresAuth: true
      }, { status: 401 });
    }

    // Mark as read in Allegro
    try {
      await markThreadAsReadAllegro(threadId);
    } catch (e) {
      console.error('Failed to mark as read in Allegro:', e.message);
    }

    // Mark as read in database
    await markAllegroThreadAsRead(threadId);

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
