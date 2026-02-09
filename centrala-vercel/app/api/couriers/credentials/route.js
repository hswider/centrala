import { sql } from '@vercel/postgres';
import { cookies } from 'next/headers';
import { initDatabase } from '../../../../lib/db';

// Check if user is admin
async function checkAdminAccess() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get('poom_user')?.value;

  if (!userCookie) return false;

  try {
    const user = JSON.parse(userCookie);
    return ['it_admin', 'it_administrator', 'admin'].includes(user.role);
  } catch (e) {
    return false;
  }
}

// GET - Fetch all courier credentials
export async function GET() {
  try {
    const hasAccess = await checkAdminAccess();
    if (!hasAccess) {
      return Response.json({ success: false, error: 'Brak dostepu' }, { status: 403 });
    }

    await initDatabase();

    const { rows } = await sql`
      SELECT courier, api_key, api_secret, account_number, environment, extra_config, updated_at
      FROM courier_credentials
      ORDER BY courier
    `;

    // Mask sensitive data for display
    const masked = rows.map(row => ({
      ...row,
      api_key: row.api_key ? '***' + row.api_key.slice(-4) : null,
      api_secret: row.api_secret ? '***' + row.api_secret.slice(-4) : null,
      has_credentials: !!(row.api_key && row.api_secret)
    }));

    return Response.json({ success: true, credentials: masked });
  } catch (error) {
    console.error('Error fetching courier credentials:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT - Update courier credentials
export async function PUT(request) {
  try {
    const hasAccess = await checkAdminAccess();
    if (!hasAccess) {
      return Response.json({ success: false, error: 'Brak dostepu' }, { status: 403 });
    }

    await initDatabase();

    const body = await request.json();
    const { courier, api_key, api_secret, account_number, environment, extra_config } = body;

    if (!courier) {
      return Response.json({ success: false, error: 'Brak nazwy kuriera' }, { status: 400 });
    }

    // Update credentials
    await sql`
      UPDATE courier_credentials
      SET
        api_key = COALESCE(${api_key}, api_key),
        api_secret = COALESCE(${api_secret}, api_secret),
        account_number = COALESCE(${account_number}, account_number),
        environment = COALESCE(${environment}, environment),
        extra_config = COALESCE(${JSON.stringify(extra_config || {})}::jsonb, extra_config),
        updated_at = CURRENT_TIMESTAMP
      WHERE courier = ${courier}
    `;

    return Response.json({ success: true, message: `Zaktualizowano ${courier}` });
  } catch (error) {
    console.error('Error updating courier credentials:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Test courier connection
export async function POST(request) {
  try {
    const hasAccess = await checkAdminAccess();
    if (!hasAccess) {
      return Response.json({ success: false, error: 'Brak dostepu' }, { status: 403 });
    }

    await initDatabase();

    const body = await request.json();
    const { courier } = body;

    if (!courier) {
      return Response.json({ success: false, error: 'Brak nazwy kuriera' }, { status: 400 });
    }

    // Get credentials
    const { rows } = await sql`
      SELECT * FROM courier_credentials WHERE courier = ${courier}
    `;

    if (rows.length === 0 || !rows[0].api_key) {
      return Response.json({ success: false, error: 'Brak skonfigurowanych danych logowania' }, { status: 400 });
    }

    const creds = rows[0];

    // Test connection based on courier type
    let testResult = { success: false, message: 'Nieobslugiwany kurier' };

    if (courier === 'inpost') {
      testResult = await testInpostConnection(creds);
    } else if (courier === 'dhl_parcel' || courier === 'dhl_express') {
      testResult = await testDhlConnection(creds, courier);
    } else if (courier === 'ups') {
      testResult = await testUpsConnection(creds);
    }

    return Response.json(testResult);
  } catch (error) {
    console.error('Error testing courier connection:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Test InPost connection
async function testInpostConnection(creds) {
  try {
    const baseUrl = creds.environment === 'production'
      ? 'https://api-shipx-pl.easypack24.net/v1'
      : 'https://sandbox-api-shipx-pl.easypack24.net/v1';

    const response = await fetch(`${baseUrl}/organizations`, {
      headers: {
        'Authorization': `Bearer ${creds.api_key}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, message: 'Polaczenie z InPost OK', data };
    } else {
      const error = await response.text();
      return { success: false, error: `InPost: ${response.status} - ${error}` };
    }
  } catch (error) {
    return { success: false, error: `InPost: ${error.message}` };
  }
}

// Test DHL connection
async function testDhlConnection(creds, courierType) {
  try {
    // DHL uses different APIs for Parcel and Express
    const baseUrl = creds.environment === 'production'
      ? 'https://api-eu.dhl.com'
      : 'https://api-sandbox.dhl.com';

    // Simple tracking test endpoint
    const response = await fetch(`${baseUrl}/track/shipments?trackingNumber=1234567890`, {
      headers: {
        'DHL-API-Key': creds.api_key,
        'Content-Type': 'application/json'
      }
    });

    // 404 means API is working but shipment not found (expected for test)
    if (response.ok || response.status === 404) {
      return { success: true, message: `Polaczenie z ${courierType.toUpperCase()} OK` };
    } else {
      const error = await response.text();
      return { success: false, error: `DHL: ${response.status} - ${error}` };
    }
  } catch (error) {
    return { success: false, error: `DHL: ${error.message}` };
  }
}

// Test UPS connection
async function testUpsConnection(creds) {
  try {
    const baseUrl = creds.environment === 'production'
      ? 'https://onlinetools.ups.com'
      : 'https://wwwcie.ups.com';

    // First get OAuth token
    const tokenResponse = await fetch(`${baseUrl}/security/v1/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${creds.api_key}:${creds.api_secret}`).toString('base64')}`
      },
      body: 'grant_type=client_credentials'
    });

    if (tokenResponse.ok) {
      return { success: true, message: 'Polaczenie z UPS OK' };
    } else {
      const error = await tokenResponse.text();
      return { success: false, error: `UPS: ${tokenResponse.status} - ${error}` };
    }
  } catch (error) {
    return { success: false, error: `UPS: ${error.message}` };
  }
}
