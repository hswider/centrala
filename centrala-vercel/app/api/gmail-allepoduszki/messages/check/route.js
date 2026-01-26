import { NextResponse } from 'next/server';
import { initDatabase, setGmailAllepoduszkiMessagesChecked } from '../../../../../lib/db';
import { isAuthenticated } from '../../../../../lib/gmail-allepoduszki';

// PUT - Mark messages as checked/unchecked
export async function PUT(request) {
  try {
    await initDatabase();

    // Check authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Gmail Allepoduszki not authenticated',
        requiresAuth: true
      }, { status: 401 });
    }

    const body = await request.json();
    const { messageIds, checked } = body;

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'messageIds array is required'
      }, { status: 400 });
    }

    if (typeof checked !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: 'checked must be a boolean'
      }, { status: 400 });
    }

    await setGmailAllepoduszkiMessagesChecked(messageIds, checked);

    return NextResponse.json({
      success: true,
      messageIds,
      checked
    });
  } catch (error) {
    console.error('Mark messages checked error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
