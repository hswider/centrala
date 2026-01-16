import { NextResponse } from 'next/server';
import { initDatabase } from '../../../../../../lib/db';
import {
  isAuthenticated,
  getAttachment
} from '../../../../../../lib/gmail-amazon-de';

// GET - Download attachment
export async function GET(request, { params }) {
  try {
    await initDatabase();

    const { messageId, attachmentId } = await params;

    // Check authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({
        success: false,
        error: 'Gmail Amazon DE not authenticated',
        requiresAuth: true
      }, { status: 401 });
    }

    if (!messageId || !attachmentId) {
      return NextResponse.json({
        success: false,
        error: 'messageId and attachmentId are required'
      }, { status: 400 });
    }

    // Get attachment data from Gmail API
    const attachmentData = await getAttachment(messageId, attachmentId);

    if (!attachmentData || !attachmentData.data) {
      return NextResponse.json({
        success: false,
        error: 'Attachment not found'
      }, { status: 404 });
    }

    // Gmail returns base64url encoded data - convert to standard base64
    const base64Data = attachmentData.data
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    // Get filename and mimetype from query params (passed from frontend)
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename') || 'attachment';
    const mimeType = searchParams.get('mimeType') || 'application/octet-stream';

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Return the file as a download
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': buffer.length.toString()
      }
    });
  } catch (error) {
    console.error('Download attachment error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
