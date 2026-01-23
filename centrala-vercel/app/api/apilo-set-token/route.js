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
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json({ error: 'refreshToken required' }, { status: 400 });
    }

    // Try to get new access token using the refresh token
    const credentials = Buffer.from(`${APILO_CLIENT_ID}:${APILO_CLIENT_SECRET}`).toString('base64');

    const refreshResponse = await axios.post(
      `${APILO_BASE_URL}/rest/auth/token/`,
      { grantType: 'refresh_token', token: refreshToken },
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    const { accessToken, refreshToken: newRefreshToken, accessTokenExpireAt } = refreshResponse.data;
    const expiresAt = accessTokenExpireAt
      ? new Date(accessTokenExpireAt).getTime() - 60000
      : Date.now() + 3600000;

    // Save to database
    await sql`
      UPDATE tokens
      SET access_token = ${accessToken},
          refresh_token = ${newRefreshToken},
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
      message: 'Token updated successfully',
      tokenExpiresAt: new Date(expiresAt).toISOString(),
      apiTest
    });
  } catch (error) {
    console.error('[Set Token] Error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.message, details: error.response?.data },
      { status: 500 }
    );
  }
}
