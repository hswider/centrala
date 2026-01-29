import { NextResponse } from 'next/server';
import { getValidAccessToken } from '../../../../../lib/allegro';

export async function GET(request, { params }) {
  try {
    const { searchParams } = new URL(request.url);
    const attachmentUrl = searchParams.get('url');
    const accessToken = await getValidAccessToken();

    const { attachmentId } = await params;

    if (!attachmentUrl && !attachmentId) {
      return NextResponse.json({ success: false, error: 'Missing url or attachmentId' }, { status: 400 });
    }

    // Extract UUID from URL or use attachmentId directly
    const uuid = attachmentUrl ? attachmentUrl.split('/').pop() : attachmentId;

    // Try multiple host patterns - Allegro uses different domains
    const urlsToTry = [
      `https://edge.salescenter.allegro.com/message-center/message-attachments/${uuid}`,
      `https://upload.allegro.pl/message-center/message-attachments/${uuid}`,
      `https://api.allegro.pl/messaging/message-attachments/${uuid}`,
    ];
    if (attachmentUrl && !urlsToTry.includes(attachmentUrl)) {
      urlsToTry.unshift(attachmentUrl);
    }

    let response = null;
    for (const url of urlsToTry) {
      // Try with auth
      let res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        redirect: 'follow'
      });
      if (res.ok) { response = res; break; }
      // Try without auth
      res = await fetch(url, { redirect: 'follow' });
      if (res.ok) { response = res; break; }
    }

    if (!response) {
      throw new Error('Attachment not found on any known host');
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
