import { NextResponse } from 'next/server';
import { isAuthenticated } from '../../../../lib/allegro-meblebox';
import { initDatabase, deleteAllegroMebleboxThread } from '../../../../lib/db';

// DELETE - Delete threads
export async function DELETE(request) {
  try {
    await initDatabase();

    // Check authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated with Allegro Meblebox',
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
        // Delete from database (Allegro API doesn't support permanent deletion)
        await deleteAllegroMebleboxThread(threadId);
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
    console.error('Delete Allegro Meblebox threads error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
