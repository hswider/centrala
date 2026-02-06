import { sql } from '@vercel/postgres';
import { cookies } from 'next/headers';

// Check if user is IT Administrator
async function checkITAdminAccess() {
  const cookieStore = await cookies();
  const username = cookieStore.get('username')?.value;

  if (!username) return false;

  const { rows } = await sql`
    SELECT role FROM users WHERE username = ${username}
  `;

  return rows.length > 0 && rows[0].role === 'it_administrator';
}

// GET - Fetch MTS SKU configurations
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sku = searchParams.get('sku');

    if (sku) {
      // Get specific SKU config
      const { rows } = await sql`
        SELECT * FROM mts_sku_config
        WHERE UPPER(TRIM(sku)) = ${sku.toUpperCase().trim()}
      `;
      return Response.json({
        success: true,
        config: rows[0] || {
          sku: sku.toUpperCase().trim(),
          growth_percent: 0,
          threshold_ok: 100,
          threshold_warning: 200,
          threshold_critical: 300
        }
      });
    }

    // Get all configs
    const { rows } = await sql`
      SELECT * FROM mts_sku_config ORDER BY sku ASC
    `;

    return Response.json({ success: true, configs: rows });
  } catch (error) {
    console.error('Error fetching MTS config:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Create or update SKU configuration
export async function POST(request) {
  try {
    const hasAccess = await checkITAdminAccess();
    if (!hasAccess) {
      return Response.json({ success: false, error: 'Brak dostępu. Tylko IT Administrator.' }, { status: 403 });
    }

    const body = await request.json();
    const { sku, growth_percent, threshold_ok, threshold_warning, threshold_critical } = body;

    if (!sku) {
      return Response.json({ success: false, error: 'SKU jest wymagane' }, { status: 400 });
    }

    const normalizedSku = sku.toString().trim().toUpperCase();

    // Check if exists
    const existing = await sql`
      SELECT id FROM mts_sku_config WHERE UPPER(TRIM(sku)) = ${normalizedSku}
    `;

    if (existing.rows.length > 0) {
      // Update
      await sql`
        UPDATE mts_sku_config SET
          growth_percent = ${growth_percent ?? 0},
          threshold_ok = ${threshold_ok ?? 100},
          threshold_warning = ${threshold_warning ?? 200},
          threshold_critical = ${threshold_critical ?? 300},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existing.rows[0].id}
      `;
    } else {
      // Insert
      await sql`
        INSERT INTO mts_sku_config (sku, growth_percent, threshold_ok, threshold_warning, threshold_critical)
        VALUES (${normalizedSku}, ${growth_percent ?? 0}, ${threshold_ok ?? 100}, ${threshold_warning ?? 200}, ${threshold_critical ?? 300})
      `;
    }

    return Response.json({ success: true, message: `Zapisano konfigurację dla ${sku}` });
  } catch (error) {
    console.error('Error saving MTS config:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT - Bulk update configurations
export async function PUT(request) {
  try {
    const hasAccess = await checkITAdminAccess();
    if (!hasAccess) {
      return Response.json({ success: false, error: 'Brak dostępu. Tylko IT Administrator.' }, { status: 403 });
    }

    const body = await request.json();
    const { configs } = body;

    if (!Array.isArray(configs)) {
      return Response.json({ success: false, error: 'configs musi być tablicą' }, { status: 400 });
    }

    let updated = 0;
    for (const config of configs) {
      const { sku, growth_percent, threshold_ok, threshold_warning, threshold_critical } = config;
      if (!sku) continue;

      const normalizedSku = sku.toString().trim().toUpperCase();

      const existing = await sql`
        SELECT id FROM mts_sku_config WHERE UPPER(TRIM(sku)) = ${normalizedSku}
      `;

      if (existing.rows.length > 0) {
        await sql`
          UPDATE mts_sku_config SET
            growth_percent = COALESCE(${growth_percent}, growth_percent),
            threshold_ok = COALESCE(${threshold_ok}, threshold_ok),
            threshold_warning = COALESCE(${threshold_warning}, threshold_warning),
            threshold_critical = COALESCE(${threshold_critical}, threshold_critical),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${existing.rows[0].id}
        `;
      } else {
        await sql`
          INSERT INTO mts_sku_config (sku, growth_percent, threshold_ok, threshold_warning, threshold_critical)
          VALUES (${normalizedSku}, ${growth_percent ?? 0}, ${threshold_ok ?? 100}, ${threshold_warning ?? 200}, ${threshold_critical ?? 300})
        `;
      }
      updated++;
    }

    return Response.json({ success: true, message: `Zaktualizowano ${updated} konfiguracji` });
  } catch (error) {
    console.error('Error bulk updating MTS config:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - Remove SKU configuration
export async function DELETE(request) {
  try {
    const hasAccess = await checkITAdminAccess();
    if (!hasAccess) {
      return Response.json({ success: false, error: 'Brak dostępu. Tylko IT Administrator.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const sku = searchParams.get('sku');

    if (!sku) {
      return Response.json({ success: false, error: 'SKU jest wymagane' }, { status: 400 });
    }

    await sql`
      DELETE FROM mts_sku_config WHERE UPPER(TRIM(sku)) = ${sku.toUpperCase().trim()}
    `;

    return Response.json({ success: true, message: `Usunięto konfigurację dla ${sku}` });
  } catch (error) {
    console.error('Error deleting MTS config:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
