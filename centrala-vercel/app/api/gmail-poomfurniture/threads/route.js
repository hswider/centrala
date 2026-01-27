import { NextResponse } from 'next/server';
import { trashThread, isAuthenticated } from '../../../../lib/gmail-poomfurniture';
import { initDatabase, deleteGmailPoomfurnitureThread } from '../../../../lib/db';

// DELETE - Delete/trash threads
export async function DELETE(request) {
  try {
    await initDatabase();

    // Check authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated with Gmail poom-furniture.com',
        requiresAuth: true
      }, { status: 401 });
    }

    const body = await request.json();
    const { threadIds } = body;

    if (!threadIds || !Array.isArray(threadIds) || threadIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Thread IDs required'
      }, { status: 400 });
    }

    const results = {
      success: [],
      failed: []
    };

    // Process each thread
    for (const threadId of threadIds) {
      try {
        // Trash in Gmail
        await trashThread(threadId);
        // Delete from database
        await deleteGmailPoomfurnitureThread(threadId);
        results.success.push(threadId);
      } catch (err) {
        console.error(`Failed to delete thread ${threadId}:`, err.message);
        results.failed.push({ threadId, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      deleted: results.success.length,
      failed: results.failed.length,
      results
    });
  } catch (error) {
    console.error('Delete Gmail poom-furniture.com threads error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
