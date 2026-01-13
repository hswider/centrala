import { NextResponse } from 'next/server';
import { getAuthorizationUrl, isAuthenticated, getCurrentUser } from '../../../../lib/allegro';
import { getAllegroTokens } from '../../../../lib/db';

// GET - Check auth status or redirect to Allegro OAuth
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // If action=login, redirect to Allegro authorization
    if (action === 'login') {
      const authUrl = getAuthorizationUrl();
      return NextResponse.redirect(authUrl);
    }

    // Otherwise, return auth status
    const authenticated = await isAuthenticated();
    const tokens = await getAllegroTokens();

    let user = null;
    if (authenticated) {
      try {
        user = await getCurrentUser();
      } catch (e) {
        // Failed to get user, token might be invalid
        console.error('Failed to get Allegro user:', e.message);
      }
    }

    return NextResponse.json({
      success: true,
      authenticated,
      user,
      expiresAt: tokens?.expires_at ? new Date(parseInt(tokens.expires_at)).toISOString() : null
    });
  } catch (error) {
    console.error('Allegro auth error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
