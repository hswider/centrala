import { NextResponse } from 'next/server';
import { getAuthorizationUrl } from '../../../../lib/allegro';
import { getAllegroTokens } from '../../../../lib/db';

// GET - Debug Allegro configuration
export async function GET() {
  try {
    const clientId = process.env.ALLEGRO_CLIENT_ID;
    const clientSecret = process.env.ALLEGRO_CLIENT_SECRET;
    const redirectUri = process.env.ALLEGRO_REDIRECT_URI || 'https://centrala-poom.vercel.app/api/allegro/callback';

    const authUrl = getAuthorizationUrl();
    const tokens = await getAllegroTokens();

    return NextResponse.json({
      config: {
        clientId: clientId ? `${clientId.substring(0, 8)}...` : 'NOT SET',
        clientIdLength: clientId?.length || 0,
        clientIdFormat: clientId ? (clientId.includes('-') ? 'UUID' : 'Other') : 'N/A',
        clientSecretSet: !!clientSecret,
        clientSecretLength: clientSecret?.length || 0,
        redirectUri,
        // Check for common issues
        clientIdHasSpaces: clientId?.includes(' ') || false,
        clientIdHasNewline: clientId?.includes('\n') || clientId?.includes('\r') || false,
        clientSecretHasSpaces: clientSecret?.includes(' ') || false,
        clientSecretHasNewline: clientSecret?.includes('\n') || clientSecret?.includes('\r') || false,
      },
      authUrl,
      tokensExist: !!(tokens?.access_token),
      tokensExpireAt: tokens?.expires_at ? new Date(parseInt(tokens.expires_at)).toISOString() : null
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
