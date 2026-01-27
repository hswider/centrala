import { NextResponse } from 'next/server';
import { initDatabase, updateGmailPoomfurnitureThreadStatus } from '../../../../../../lib/db';
import { isAuthenticated } from '../../../../../../lib/gmail-poomfurniture';

// PUT - Update thread status
export async function PUT(request, { params }) {
  try {
    await initDatabase();

    const { threadId } = await params;

    // Check authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Gmail Poomfurniture not authenticated',
        requiresAuth: true
      }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !['new', 'read', 'resolved', 'sent'].includes(status)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid status. Must be "new", "read", "resolved" or "sent"'
      }, { status: 400 });
    }

    await updateGmailPoomfurnitureThreadStatus(threadId, status);

    return NextResponse.json({
      success: true,
      threadId,
      status
    });
  } catch (error) {
    console.error('Update thread status error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
