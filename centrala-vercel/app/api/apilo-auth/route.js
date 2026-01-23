import { NextResponse } from 'next/server';
import axios from 'axios';
import { sql } from '@vercel/postgres';
import { initDatabase } from '@/lib/db';

const APILO_BASE_URL = process.env.APILO_BASE_URL;
const APILO_CLIENT_ID = process.env.APILO_CLIENT_ID;
const APILO_CLIENT_SECRET = process.env.APILO_CLIENT_SECRET;

export async function POST(request) {
  try {
    await initDatabase();

    const body = await request.json();
    const { authCode } = body;

    if (!authCode) {
      return NextResponse.json({ error: 'authCode required' }, { status: 400 });
    }

    const credentials = Buffer.from(`${APILO_CLIENT_ID}:${APILO_CLIENT_SECRET}`).toString('base64');

    // Try authorization_code grant type
    let tokenResponse;
    try {
      tokenResponse = await axios.post(
        `${APILO_BASE_URL}/rest/auth/token/`,
        {
          grantType: 'authorization_code',
          code: authCode
        },
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
    } catch (e) {
      // If authorization_code doesn't work, try other grant types
      console.log('authorization_code failed:', e.response?.data);

      // Try with client_credentials
      try {
        tokenResponse = await axios.post(
          `${APILO_BASE_URL}/rest/auth/token/`,
          {
            grantType: 'client_credentials'
          },
          {
            headers: {
              'Authorization': `Basic ${credentials}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }
        );
      } catch (e2) {
        return NextResponse.json({
          error: 'Both grant types failed',
          authCodeError: e.response?.data || e.message,
          clientCredentialsError: e2.response?.data || e2.message
        }, { status: 500 });
      }
    }

    const { accessToken, refreshToken, accessTokenExpireAt } = tokenResponse.data;
    const expiresAt = accessTokenExpireAt
      ? new Date(accessTokenExpireAt).getTime() - 60000
      : Date.now() + 3600000;

    // Save to database
    await sql`
      UPDATE tokens
      SET access_token = ${accessToken},
          refresh_token = ${refreshToken},
          expires_at = ${expiresAt},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `;

    // Test the API
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    let apiTest = {};
    try {
      const res = await axios.get(`${APILO_BASE_URL}/rest/api/orders/?limit=3`, { headers });
      apiTest = {
        success: true,
        ordersCount: res.data?.orders?.length || 0,
        firstOrderId: res.data?.orders?.[0]?.id,
        firstOrderDate: res.data?.orders?.[0]?.orderedAt
      };
    } catch (e) {
      apiTest = {
        success: false,
        error: e.message,
        details: e.response?.data
      };
    }

    return NextResponse.json({
      success: true,
      message: 'Tokens obtained and saved',
      hasRefreshToken: !!refreshToken,
      tokenExpiresAt: new Date(expiresAt).toISOString(),
      apiTest
    });
  } catch (error) {
    console.error('[Apilo Auth] Error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.message, details: error.response?.data },
      { status: 500 }
    );
  }
}
