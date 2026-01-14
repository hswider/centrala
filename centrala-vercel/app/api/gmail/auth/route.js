import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { getAuthorizationUrl, isAuthenticated, getCurrentUser } from '../../../../lib/gmail';
import { initDatabase, getGmailTokens } from '../../../../lib/db';

export async function GET(request) {
  try {
    await initDatabase();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Login action - redirect to Google OAuth
    if (action === 'login') {
      const authUrl = getAuthorizationUrl();
      return NextResponse.redirect(authUrl);
    }

    // Default: Return authentication status
    const authenticated = await isAuthenticated();
    let user = null;
    let expiresAt = null;

    if (authenticated) {
      user = await getCurrentUser();
      const tokens = await getGmailTokens();
      expiresAt = tokens?.expires_at;
    }

    return NextResponse.json({
      authenticated,
      user,
      expiresAt
    });
  } catch (error) {
    console.error('Gmail auth error:', error);
    return NextResponse.json(
      { authenticated: false, error: error.message },
      { status: 500 }
    );
  }
}
