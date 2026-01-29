import { NextResponse } from 'next/server';
import { getValidAccessToken } from '../../../../../lib/allegro';

export async function GET(request, { params }) {
  try {
    const { searchParams } = new URL(request.url);
    const attachmentUrl = searchParams.get('url');
    const accessToken = await getValidAccessToken();

    if (!attachmentUrl) {
      return NextResponse.json({ success: false, error: 'Missing url param' }, { status: 400 });
    }

    // Try with auth first, then without
    let response = await fetch(attachmentUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      response = await fetch(attachmentUrl);
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch attachment (${response.status})`);
    }

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
