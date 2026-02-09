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

// Sensitive fields that should be masked
const SENSITIVE_FIELDS = ['password', 'api_key', 'api_secret', 'api_token', 'client_id', 'client_secret'];

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
    const masked = rows.map(row => {
      const extraConfig = row.extra_config || {};

      // Mask sensitive fields in extra_config
      const maskedExtraConfig = {};
      for (const [key, value] of Object.entries(extraConfig)) {
        if (SENSITIVE_FIELDS.includes(key) && value) {
          maskedExtraConfig[key] = '***' + String(value).slice(-4);
        } else {
          maskedExtraConfig[key] = value;
        }
      }

      // Check if courier has required credentials based on type
      let hasCredentials = false;
      if (row.courier === 'dhl_parcel') {
        hasCredentials = !!(extraConfig.login && extraConfig.password && extraConfig.sap_number);
      } else if (row.courier === 'dhl_express') {
        hasCredentials = !!(extraConfig.api_key && extraConfig.api_secret);
      } else if (row.courier === 'inpost') {
        hasCredentials = !!extraConfig.api_token;
      } else if (row.courier === 'ups') {
        hasCredentials = !!(extraConfig.client_id && extraConfig.client_secret);
      }

      return {
        ...row,
        api_key: row.api_key ? '***' + row.api_key.slice(-4) : null,
        api_secret: row.api_secret ? '***' + row.api_secret.slice(-4) : null,
        extra_config: maskedExtraConfig,
        has_credentials: hasCredentials
      };
    });

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

    // Get existing extra_config to merge with new values
    const { rows: existing } = await sql`
      SELECT extra_config FROM courier_credentials WHERE courier = ${courier}
    `;

    const existingConfig = existing[0]?.extra_config || {};
    const newConfig = extra_config || {};

    // Merge configs - only update fields that have non-empty values
    const mergedConfig = { ...existingConfig };
    for (const [key, value] of Object.entries(newConfig)) {
      // For booleans, always update
      if (typeof value === 'boolean') {
        mergedConfig[key] = value;
      }
      // For strings, only update if not empty
      else if (value && String(value).trim()) {
        mergedConfig[key] = value;
      }
    }

    // Update credentials
    await sql`
      UPDATE courier_credentials
      SET
        api_key = COALESCE(${api_key || null}, api_key),
        api_secret = COALESCE(${api_secret || null}, api_secret),
        account_number = COALESCE(${account_number || null}, account_number),
        environment = COALESCE(${environment || null}, environment),
        extra_config = ${JSON.stringify(mergedConfig)}::jsonb,
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

    if (rows.length === 0) {
      return Response.json({ success: false, error: 'Brak skonfigurowanych danych logowania' }, { status: 400 });
    }

    const creds = rows[0];
    const extraConfig = creds.extra_config || {};

    // Test connection based on courier type
    let testResult = { success: false, message: 'Nieobslugiwany kurier' };

    if (courier === 'inpost') {
      if (!extraConfig.api_token) {
        return Response.json({ success: false, error: 'Brak tokenu API InPost' }, { status: 400 });
      }
      testResult = await testInpostConnection(creds, extraConfig);
    } else if (courier === 'dhl_parcel') {
      if (!extraConfig.login || !extraConfig.password || !extraConfig.sap_number) {
        return Response.json({ success: false, error: 'Brak wymaganych danych DHL Parcel (login, hasło, SAP)' }, { status: 400 });
      }
      testResult = await testDhlParcelConnection(creds, extraConfig);
    } else if (courier === 'dhl_express') {
      if (!extraConfig.api_key || !extraConfig.api_secret) {
        return Response.json({ success: false, error: 'Brak wymaganych danych DHL Express (API Key, Secret)' }, { status: 400 });
      }
      testResult = await testDhlExpressConnection(creds, extraConfig);
    } else if (courier === 'ups') {
      if (!extraConfig.client_id || !extraConfig.client_secret) {
        return Response.json({ success: false, error: 'Brak wymaganych danych UPS (Client ID, Secret)' }, { status: 400 });
      }
      testResult = await testUpsConnection(creds, extraConfig);
    }

    return Response.json(testResult);
  } catch (error) {
    console.error('Error testing courier connection:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Test InPost connection
async function testInpostConnection(creds, extraConfig) {
  try {
    const baseUrl = creds.environment === 'production'
      ? 'https://api-shipx-pl.easypack24.net/v1'
      : 'https://sandbox-api-shipx-pl.easypack24.net/v1';

    const response = await fetch(`${baseUrl}/organizations`, {
      headers: {
        'Authorization': `Bearer ${extraConfig.api_token}`,
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

// Test DHL Parcel PL connection (WebAPI v2)
async function testDhlParcelConnection(creds, extraConfig) {
  try {
    // DHL Parcel PL uses different authentication - login/password + SAP number
    const baseUrl = creds.environment === 'production'
      ? 'https://dhl24.com.pl/webapi2'
      : 'https://sandbox.dhl24.com.pl/webapi2';

    // Test with getVersion endpoint which doesn't require full auth
    const response = await fetch(`${baseUrl}/rest/getVersion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        authData: {
          username: extraConfig.login,
          password: extraConfig.password
        }
      })
    });

    const data = await response.json();

    if (data.version || response.ok) {
      return { success: true, message: `Polaczenie z DHL Parcel OK (SAP: ${extraConfig.sap_number})` };
    } else {
      return { success: false, error: `DHL Parcel: ${data.error || JSON.stringify(data)}` };
    }
  } catch (error) {
    return { success: false, error: `DHL Parcel: ${error.message}` };
  }
}

// Test DHL Express connection
async function testDhlExpressConnection(creds, extraConfig) {
  try {
    const baseUrl = creds.environment === 'production'
      ? 'https://api-eu.dhl.com'
      : 'https://api-sandbox.dhl.com';

    // Simple tracking test endpoint
    const response = await fetch(`${baseUrl}/track/shipments?trackingNumber=1234567890`, {
      headers: {
        'DHL-API-Key': extraConfig.api_key,
        'Content-Type': 'application/json'
      }
    });

    // 404 means API is working but shipment not found (expected for test)
    if (response.ok || response.status === 404) {
      return { success: true, message: 'Polaczenie z DHL Express OK' };
    } else {
      const error = await response.text();
      return { success: false, error: `DHL Express: ${response.status} - ${error}` };
    }
  } catch (error) {
    return { success: false, error: `DHL Express: ${error.message}` };
  }
}

// Test UPS connection
async function testUpsConnection(creds, extraConfig) {
  try {
    const baseUrl = creds.environment === 'production'
      ? 'https://onlinetools.ups.com'
      : 'https://wwwcie.ups.com';

    // First get OAuth token
    const tokenResponse = await fetch(`${baseUrl}/security/v1/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${extraConfig.client_id}:${extraConfig.client_secret}`).toString('base64')}`
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
