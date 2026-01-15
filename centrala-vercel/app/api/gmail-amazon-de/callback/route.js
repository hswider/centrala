import { NextResponse } from 'next/server';
import { initDatabase, saveGmailAmazonDeTokens } from '../../../../lib/db';
import { exchangeCodeForTokens, getUserProfile } from '../../../../lib/gmail-amazon-de';

// GET - Handle OAuth callback
export async function GET(request) {
  try {
    await initDatabase();

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL('/crm-eu?gmail_amazon_de_error=' + error, request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/crm-eu?gmail_amazon_de_error=no_code', request.url));
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    const expiresAt = Date.now() + (tokens.expires_in * 1000);

    // Save tokens to database
    await saveGmailAmazonDeTokens(
      tokens.access_token,
      tokens.refresh_token,
      expiresAt,
      null // Email will be fetched later
    );

    // Try to get user profile to save email
    try {
      // Need to manually fetch profile since tokens are now saved
      const profileResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      });

      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        await saveGmailAmazonDeTokens(
          tokens.access_token,
          tokens.refresh_token,
          expiresAt,
          profile.emailAddress
        );
      }
    } catch (e) {
      console.error('Could not fetch Gmail profile:', e.message);
    }

    return NextResponse.redirect(new URL('/crm-eu?gmail_amazon_de_connected=true', request.url));
  } catch (error) {
    console.error('Gmail Amazon DE OAuth callback error:', error);
    return NextResponse.redirect(new URL('/crm-eu?gmail_amazon_de_error=' + encodeURIComponent(error.message), request.url));
  }
}
