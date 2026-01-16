import { NextResponse } from 'next/server';
import { initDatabase, updateGmailAmazonDeThreadStatus } from '../../../../../../lib/db';
import { isAuthenticated } from '../../../../../../lib/gmail-amazon-de';

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
        error: 'Gmail Amazon DE not authenticated',
        requiresAuth: true
      }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !['open', 'resolved'].includes(status)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid status. Must be "open" or "resolved"'
      }, { status: 400 });
    }

    await updateGmailAmazonDeThreadStatus(threadId, status);

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
