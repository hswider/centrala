import { NextResponse } from 'next/server';
import { getAuthorizationUrl, isAuthenticated, getCurrentUser } from '../../../../lib/gmail-allepoduszki';
import { initDatabase, getGmailAllepoduszkiTokens, clearGmailAllepoduszkiTokens } from '../../../../lib/db';

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
      const tokens = await getGmailAllepoduszkiTokens();
      expiresAt = tokens?.expires_at;
    }

    return NextResponse.json({
      authenticated,
      user,
      expiresAt
    });
  } catch (error) {
    console.error('Gmail ALLEPODUSZKI auth error:', error);
    return NextResponse.json(
      { authenticated: false, error: error.message },
      { status: 500 }
    );
  }
}

// Logout - clear tokens
export async function DELETE(request) {
  try {
    await initDatabase();
    await clearGmailAllepoduszkiTokens();
    return NextResponse.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Gmail ALLEPODUSZKI logout error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
