import { NextResponse } from 'next/server';
import { getValidAccessToken } from '../../../../../lib/allegro';

const ALLEGRO_API_URL = 'https://api.allegro.pl';

export async function GET(request, { params }) {
  try {
    const { attachmentId } = await params;
    const { searchParams } = new URL(request.url);
    const attachmentUrl = searchParams.get('url');
    const accessToken = await getValidAccessToken();

    // Build list of URLs to try
    const urlsToTry = [];

    // If a full URL was provided, try it first
    if (attachmentUrl) {
      const fullUrl = attachmentUrl.startsWith('http') ? attachmentUrl : `${ALLEGRO_API_URL}${attachmentUrl}`;
      urlsToTry.push(fullUrl);
    }

    // Also try by attachment ID
    urlsToTry.push(`${ALLEGRO_API_URL}/messaging/message-attachments/${attachmentId}`);

    for (const url of urlsToTry) {
      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (response.ok) {
          const contentType = response.headers.get('content-type') || 'application/octet-stream';
          const buffer = await response.arrayBuffer();
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=86400',
            }
          });
        }
      } catch (e) {
        // Try next URL
      }
    }

    throw new Error('Attachment not found');
  } catch (error) {
    console.error('Attachment download error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
