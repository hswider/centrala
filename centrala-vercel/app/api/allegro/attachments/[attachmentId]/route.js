import { NextResponse } from 'next/server';
import { downloadAttachment } from '../../../../../lib/allegro';

export async function GET(request, { params }) {
  try {
    const { attachmentId } = await params;

    const response = await downloadAttachment(attachmentId);

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      }
    });
  } catch (error) {
    console.error('Attachment download error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
