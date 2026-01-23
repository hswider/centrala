import { NextResponse } from 'next/server';
import axios from 'axios';
import { getTokens, saveTokens, initDatabase } from '@/lib/db';

const APILO_BASE_URL = process.env.APILO_BASE_URL;
const APILO_CLIENT_ID = process.env.APILO_CLIENT_ID;
const APILO_CLIENT_SECRET = process.env.APILO_CLIENT_SECRET;

export async function GET(request) {
  try {
    await initDatabase();
    const tokens = await getTokens();

    if (!tokens?.refresh_token) {
      return NextResponse.json({ error: 'No refresh token available' }, { status: 401 });
    }

    // Force token refresh
    const credentials = Buffer.from(`${APILO_CLIENT_ID}:${APILO_CLIENT_SECRET}`).toString('base64');

    const refreshResponse = await axios.post(
      `${APILO_BASE_URL}/rest/auth/token/`,
      { grantType: 'refresh_token', token: tokens.refresh_token },
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

    await saveTokens(accessToken, newRefreshToken, expiresAt);

    // Now test the API with new token
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const results = {};

    // Test orders endpoint
    try {
      const res = await axios.get(`${APILO_BASE_URL}/rest/api/orders/?limit=3`, { headers });
      results.orders = {
        success: true,
        count: res.data?.orders?.length || 0,
        firstId: res.data?.orders?.[0]?.id,
        firstOrderedAt: res.data?.orders?.[0]?.orderedAt
      };
    } catch (e) {
      results.orders = {
        success: false,
        error: e.message,
        status: e.response?.status,
        details: e.response?.data
      };
    }

    return NextResponse.json({
      tokenRefreshed: true,
      newTokenExpiresAt: new Date(expiresAt).toISOString(),
      apiTest: results
    });
  } catch (error) {
    console.error('[Apilo Refresh] Error:', error.response?.data || error.message);
    return NextResponse.json(
      {
        error: error.message,
        details: error.response?.data,
        hint: 'Token refresh failed - may need new tokens from Apilo panel'
      },
      { status: 500 }
    );
  }
}
