import { NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '../../../../lib/allegro';
import { initDatabase } from '../../../../lib/db';

// GET - Handle OAuth callback from Allegro
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Initialize database to ensure tables exist
    await initDatabase();

    // Handle errors from Allegro
    if (error) {
      const errorDescription = searchParams.get('error_description') || 'Unknown error';
      console.error('Allegro OAuth error:', error, errorDescription);
      return NextResponse.redirect(
        new URL(`/crm?allegro_error=${encodeURIComponent(errorDescription)}`, request.url)
      );
    }

    // No code provided
    if (!code) {
      return NextResponse.redirect(
        new URL('/crm?allegro_error=No%20authorization%20code%20provided', request.url)
      );
    }

    // Exchange code for tokens
    await exchangeCodeForTokens(code);

    // Redirect to CRM page with success message
    return NextResponse.redirect(
      new URL('/crm?allegro_success=true', request.url)
    );
  } catch (error) {
    console.error('Allegro callback error:', error);
    return NextResponse.redirect(
      new URL(`/crm?allegro_error=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}
