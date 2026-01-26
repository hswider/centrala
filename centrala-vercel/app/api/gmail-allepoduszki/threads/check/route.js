import { NextResponse } from 'next/server';
import { initDatabase, setGmailAllepoduszkiThreadChecked } from '../../../../../lib/db';
import { isAuthenticated } from '../../../../../lib/gmail-allepoduszki';

// PUT - Mark thread as checked/unchecked
export async function PUT(request) {
  try {
    await initDatabase();

    // Check authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Gmail not authenticated',
        requiresAuth: true
      }, { status: 401 });
    }

    const body = await request.json();
    const { threadId, checked } = body;

    if (!threadId) {
      return NextResponse.json({
        success: false,
        error: 'threadId is required'
      }, { status: 400 });
    }

    if (typeof checked !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: 'checked must be a boolean'
      }, { status: 400 });
    }

    await setGmailAllepoduszkiThreadChecked(threadId, checked);

    return NextResponse.json({
      success: true,
      threadId,
      checked
    });
  } catch (error) {
    console.error('Mark thread checked error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
