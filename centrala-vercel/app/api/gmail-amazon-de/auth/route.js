import { NextResponse } from 'next/server';
import { initDatabase, getGmailAmazonDeTokens, clearGmailAmazonDeTokens } from '../../../../lib/db';
import { getAuthUrl, isAuthenticated, getUserProfile } from '../../../../lib/gmail-amazon-de';

// GET - Check auth status and get auth URL
export async function GET() {
  try {
    await initDatabase();

    const authenticated = await isAuthenticated();
    const tokens = await getGmailAmazonDeTokens();

    if (authenticated) {
      let profile = null;
      try {
        profile = await getUserProfile();
      } catch (e) {
        console.error('Could not get Gmail profile:', e.message);
      }

      return NextResponse.json({
        success: true,
        authenticated: true,
        email: tokens?.email || profile?.emailAddress || null
      });
    }

    return NextResponse.json({
      success: true,
      authenticated: false,
      authUrl: getAuthUrl()
    });
  } catch (error) {
    console.error('Gmail Amazon DE auth check error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Logout / clear tokens to force re-authorization
export async function DELETE() {
  try {
    await initDatabase();
    await clearGmailAmazonDeTokens();

    return NextResponse.json({
      success: true,
      message: 'Tokens cleared. Please re-authorize.',
      authUrl: getAuthUrl()
    });
  } catch (error) {
    console.error('Gmail Amazon DE logout error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
