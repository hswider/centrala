import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { initDatabase } from '@/lib/db';

export async function GET() {
  try {
    await initDatabase();

    const integrations = [];

    // Check Apilo tokens
    try {
      const apiloTokens = await sql`SELECT access_token, expires_at, updated_at FROM tokens WHERE id = 1`;
      const token = apiloTokens.rows[0];
      const expiresAt = token?.expires_at ? parseInt(token.expires_at) : 0;
      const isValid = expiresAt > Date.now();
      const daysUntilExpiry = Math.round((expiresAt - Date.now()) / (24 * 60 * 60 * 1000));

      integrations.push({
        id: 'apilo',
        name: 'Apilo',
        category: 'orders',
        status: isValid ? 'ok' : 'error',
        message: isValid ? `Token ważny ${daysUntilExpiry} dni` : 'Token wygasł',
        lastSync: token?.updated_at
      });
    } catch (e) {
      integrations.push({
        id: 'apilo',
        name: 'Apilo',
        category: 'orders',
        status: 'error',
        message: e.message
      });
    }

    // Check Baselinker (just check if configured)
    const baselinkerConfigured = !!process.env.BASELINKER_API_KEY;
    integrations.push({
      id: 'baselinker',
      name: 'Baselinker',
      category: 'orders',
      status: baselinkerConfigured ? 'ok' : 'disabled',
      message: baselinkerConfigured ? 'Skonfigurowany' : 'Nie skonfigurowany'
    });

    // Check Gmail Shopify Dobrelegowiska
    try {
      const gmailTokens = await sql`SELECT email, expires_at, updated_at FROM gmail_tokens WHERE id = 1`;
      const token = gmailTokens.rows[0];
      const isValid = token?.expires_at && parseInt(token.expires_at) > Date.now();

      integrations.push({
        id: 'gmail-shopify',
        name: 'Gmail Shopify',
        category: 'crm-pl',
        status: token ? (isValid ? 'ok' : 'warning') : 'error',
        message: token ? (isValid ? token.email : 'Token wymaga odświeżenia') : 'Nie połączono',
        lastSync: token?.updated_at
      });
    } catch (e) {
      integrations.push({
        id: 'gmail-shopify',
        name: 'Gmail Shopify',
        category: 'crm-pl',
        status: 'error',
        message: 'Błąd sprawdzania'
      });
    }

    // Check Gmail POOMKIDS
    try {
      const tokens = await sql`SELECT email, expires_at, updated_at FROM gmail_poomkids_tokens WHERE id = 1`;
      const token = tokens.rows[0];
      const isValid = token?.expires_at && parseInt(token.expires_at) > Date.now();

      integrations.push({
        id: 'gmail-poomkids',
        name: 'Gmail POOMKIDS',
        category: 'crm-pl',
        status: token ? (isValid ? 'ok' : 'warning') : 'error',
        message: token ? (isValid ? token.email : 'Token wymaga odświeżenia') : 'Nie połączono',
        lastSync: token?.updated_at
      });
    } catch (e) {
      integrations.push({
        id: 'gmail-poomkids',
        name: 'Gmail POOMKIDS',
        category: 'crm-pl',
        status: 'error',
        message: 'Błąd sprawdzania'
      });
    }

    // Check Gmail Allepoduszki
    try {
      const tokens = await sql`SELECT email, expires_at, updated_at FROM gmail_allepoduszki_tokens WHERE id = 1`;
      const token = tokens.rows[0];
      const isValid = token?.expires_at && parseInt(token.expires_at) > Date.now();

      integrations.push({
        id: 'gmail-allepoduszki',
        name: 'Gmail Allepoduszki',
        category: 'crm-pl',
        status: token ? (isValid ? 'ok' : 'warning') : 'error',
        message: token ? (isValid ? token.email : 'Token wymaga odświeżenia') : 'Nie połączono',
        lastSync: token?.updated_at
      });
    } catch (e) {
      integrations.push({
        id: 'gmail-allepoduszki',
        name: 'Gmail Allepoduszki',
        category: 'crm-pl',
        status: 'error',
        message: 'Błąd sprawdzania'
      });
    }

    // Check Gmail poom-furniture
    try {
      const tokens = await sql`SELECT email, expires_at, updated_at FROM gmail_poomfurniture_tokens WHERE id = 1`;
      const token = tokens.rows[0];
      const isValid = token?.expires_at && parseInt(token.expires_at) > Date.now();

      integrations.push({
        id: 'gmail-poomfurniture',
        name: 'Gmail poom-furniture',
        category: 'crm-pl',
        status: token ? (isValid ? 'ok' : 'warning') : 'error',
        message: token ? (isValid ? token.email : 'Token wymaga odświeżenia') : 'Nie połączono',
        lastSync: token?.updated_at
      });
    } catch (e) {
      integrations.push({
        id: 'gmail-poomfurniture',
        name: 'Gmail poom-furniture',
        category: 'crm-pl',
        status: 'error',
        message: 'Błąd sprawdzania'
      });
    }

    // Check Allegro Dobrelegowiska
    try {
      const tokens = await sql`SELECT access_token, expires_at, updated_at FROM allegro_tokens WHERE id = 1`;
      const token = tokens.rows[0];
      const isValid = token?.expires_at && parseInt(token.expires_at) > Date.now();

      integrations.push({
        id: 'allegro-dobrelegowiska',
        name: 'Allegro Dobrelegowiska',
        category: 'crm-pl',
        status: token ? (isValid ? 'ok' : 'warning') : 'error',
        message: token ? (isValid ? 'Połączono' : 'Token wymaga odświeżenia') : 'Nie połączono',
        lastSync: token?.updated_at
      });
    } catch (e) {
      integrations.push({
        id: 'allegro-dobrelegowiska',
        name: 'Allegro Dobrelegowiska',
        category: 'crm-pl',
        status: 'error',
        message: 'Błąd sprawdzania'
      });
    }

    // Check Gmail Amazon DE
    try {
      const tokens = await sql`SELECT email, expires_at, updated_at FROM gmail_amazon_de_tokens WHERE id = 1`;
      const token = tokens.rows[0];
      const isValid = token?.expires_at && parseInt(token.expires_at) > Date.now();

      integrations.push({
        id: 'gmail-amazon-de',
        name: 'Gmail Amazon DE',
        category: 'crm-eu',
        status: token ? (isValid ? 'ok' : 'warning') : 'error',
        message: token ? (isValid ? token.email : 'Token wymaga odświeżenia') : 'Nie połączono',
        lastSync: token?.updated_at
      });
    } catch (e) {
      integrations.push({
        id: 'gmail-amazon-de',
        name: 'Gmail Amazon DE',
        category: 'crm-eu',
        status: 'error',
        message: 'Błąd sprawdzania'
      });
    }

    // Check Allegro Meblebox
    try {
      const tokens = await sql`SELECT access_token, expires_at, updated_at FROM allegro_meblebox_tokens WHERE id = 1`;
      const token = tokens.rows[0];
      const isValid = token?.expires_at && parseInt(token.expires_at) > Date.now();

      integrations.push({
        id: 'allegro-meblebox',
        name: 'Allegro Meblebox',
        category: 'crm-eu',
        status: token ? (isValid ? 'ok' : 'warning') : 'error',
        message: token ? (isValid ? 'Połączono' : 'Token wymaga odświeżenia') : 'Nie połączono',
        lastSync: token?.updated_at
      });
    } catch (e) {
      integrations.push({
        id: 'allegro-meblebox',
        name: 'Allegro Meblebox',
        category: 'crm-eu',
        status: 'error',
        message: 'Błąd sprawdzania'
      });
    }

    // Check Kaufland
    const kauflandConfigured = !!process.env.KAUFLAND_CLIENT_KEY && !!process.env.KAUFLAND_SECRET_KEY;
    integrations.push({
      id: 'kaufland',
      name: 'Kaufland',
      category: 'crm-eu',
      status: kauflandConfigured ? 'ok' : 'disabled',
      message: kauflandConfigured ? 'Skonfigurowany' : 'Nie skonfigurowany'
    });

    // Calculate summary
    const summary = {
      total: integrations.length,
      ok: integrations.filter(i => i.status === 'ok').length,
      warning: integrations.filter(i => i.status === 'warning').length,
      error: integrations.filter(i => i.status === 'error').length,
      disabled: integrations.filter(i => i.status === 'disabled').length
    };

    return NextResponse.json({
      success: true,
      integrations,
      summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Integrations Status] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
