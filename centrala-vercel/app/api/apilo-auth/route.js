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
    const errors = [];

    // Try multiple approaches
    let tokenResponse;

    // Approach 1: authorization_code with "token" field (per Apilo docs)
    try {
      tokenResponse = await axios.post(
        `${APILO_BASE_URL}/rest/auth/token/`,
        {
          grantType: 'authorization_code',
          token: authCode  // Apilo uses "token" not "code"!
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
      errors.push({ approach: 'json_auth_code', error: e.response?.data || e.message });
    }

    // Approach 2: Use the auth code AS the token (maybe it's already a token?)
    if (!tokenResponse) {
      try {
        tokenResponse = await axios.post(
          `${APILO_BASE_URL}/rest/auth/token/`,
          {
            grantType: 'refresh_token',
            token: authCode
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
        errors.push({ approach: 'as_refresh_token', error: e.response?.data || e.message });
      }
    }

    // Approach 3: form-urlencoded format
    if (!tokenResponse) {
      try {
        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('code', authCode);
        params.append('client_id', APILO_CLIENT_ID);
        params.append('client_secret', APILO_CLIENT_SECRET);

        tokenResponse = await axios.post(
          `${APILO_BASE_URL}/rest/auth/token/`,
          params,
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json'
            }
          }
        );
      } catch (e) {
        errors.push({ approach: 'form_urlencoded', error: e.response?.data || e.message });
      }
    }

    if (!tokenResponse) {
      return NextResponse.json({
        error: 'All approaches failed',
        attempts: errors
      }, { status: 500 });
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
