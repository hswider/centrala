import { NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '../../../../lib/gmail-poomfurniture';
import { initDatabase } from '../../../../lib/db';

export async function GET(request) {
  try {
    await initDatabase();

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Handle OAuth error
    if (error) {
      console.error('Gmail POOMFURNITURE OAuth error:', error);
      return NextResponse.redirect(new URL(`/crm?poomfurniture_gmail_error=${encodeURIComponent(error)}`, request.url));
    }

    // No code provided
    if (!code) {
      return NextResponse.redirect(new URL('/crm?poomfurniture_gmail_error=no_code', request.url));
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    console.log('Gmail POOMFURNITURE authenticated:', tokens.email);

    return NextResponse.redirect(new URL('/crm?poomfurniture_gmail_success=true', request.url));
  } catch (error) {
    console.error('Gmail POOMFURNITURE callback error:', error);
    return NextResponse.redirect(
      new URL(`/crm?poomfurniture_gmail_error=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}
