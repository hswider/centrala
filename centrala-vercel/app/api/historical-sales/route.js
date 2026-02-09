import { sql } from '@vercel/postgres';
import { cookies } from 'next/headers';

// Check if user is IT Administrator
async function checkITAdminAccess() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get('poom_user')?.value;

  // Only IT Administrator has access
  if (!userCookie) return false;

  try {
    const user = JSON.parse(userCookie);
    return user.role === 'it_administrator';
  } catch (e) {
    return false;
  }
}

// GET - Fetch historical sales data
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year')) || new Date().getFullYear() - 1;
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')) : null;

    // Get all products from WMS (gotowe category) with their historical sales
    let query;
    if (month) {
      query = await sql`
        SELECT
          i.sku,
          i.nazwa,
          COALESCE(hs.quantity, 0) as quantity,
          hs.year,
          hs.month
        FROM inventory i
        LEFT JOIN historical_sales hs ON UPPER(TRIM(i.sku)) = UPPER(TRIM(hs.sku))
          AND hs.year = ${year}
          AND hs.month = ${month}
        WHERE i.kategoria = 'gotowe'
        ORDER BY i.nazwa ASC
      `;
    } else {
      // Get all months for the year
      query = await sql`
        SELECT
          i.sku,
          i.nazwa,
          hs.quantity,
          hs.year,
          hs.month
        FROM inventory i
        LEFT JOIN historical_sales hs ON UPPER(TRIM(i.sku)) = UPPER(TRIM(hs.sku))
          AND hs.year = ${year}
        WHERE i.kategoria = 'gotowe'
        ORDER BY i.nazwa ASC, hs.month ASC
      `;
    }

    return Response.json({
      success: true,
      year,
      month,
      data: query.rows
    });
  } catch (error) {
    console.error('Error fetching historical sales:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Import CSV data (adds to existing values)
export async function POST(request) {
  try {
    // Check access
    const hasAccess = await checkITAdminAccess();
    if (!hasAccess) {
      return Response.json({ success: false, error: 'Brak dostępu. Tylko IT Administrator.' }, { status: 403 });
    }

    const body = await request.json();
    const { year, month, data } = body;

    if (!year || !month || !data || !Array.isArray(data)) {
      return Response.json({ success: false, error: 'Brak wymaganych danych (year, month, data)' }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;
    let errors = [];

    for (const row of data) {
      const { sku, quantity } = row;

      if (!sku || quantity === undefined || quantity === null) {
        skipped++;
        continue;
      }

      const normalizedSku = sku.toString().trim().toUpperCase();
      const qty = parseInt(quantity) || 0;

      if (qty < 0) {
        errors.push(`SKU ${sku}: ujemna ilość`);
        continue;
      }

      try {
        // Check if record exists
        const existing = await sql`
          SELECT id, quantity FROM historical_sales
          WHERE UPPER(TRIM(sku)) = ${normalizedSku}
            AND year = ${year}
            AND month = ${month}
        `;

        if (existing.rows.length > 0) {
          // Add to existing value
          const newQuantity = (existing.rows[0].quantity || 0) + qty;
          await sql`
            UPDATE historical_sales
            SET quantity = ${newQuantity}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${existing.rows[0].id}
          `;
        } else {
          // Insert new record
          await sql`
            INSERT INTO historical_sales (sku, year, month, quantity)
            VALUES (${normalizedSku}, ${year}, ${month}, ${qty})
          `;
        }
        imported++;
      } catch (err) {
        errors.push(`SKU ${sku}: ${err.message}`);
      }
    }

    return Response.json({
      success: true,
      imported,
      skipped,
      errors: errors.length > 0 ? errors : null,
      message: `Zaimportowano ${imported} rekordów, pominięto ${skipped}${errors.length > 0 ? `, błędy: ${errors.length}` : ''}`
    });
  } catch (error) {
    console.error('Error importing historical sales:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT - Update single record or reset month data
export async function PUT(request) {
  try {
    const hasAccess = await checkITAdminAccess();
    if (!hasAccess) {
      return Response.json({ success: false, error: 'Brak dostępu. Tylko IT Administrator.' }, { status: 403 });
    }

    const body = await request.json();
    const { action, year, month, sku, quantity } = body;

    if (action === 'reset_month') {
      // Reset all quantities for a specific month
      await sql`
        DELETE FROM historical_sales
        WHERE year = ${year} AND month = ${month}
      `;
      return Response.json({ success: true, message: `Zresetowano dane dla ${month}/${year}` });
    }

    if (action === 'update_sku') {
      // Update specific SKU quantity
      const normalizedSku = sku.toString().trim().toUpperCase();

      const existing = await sql`
        SELECT id FROM historical_sales
        WHERE UPPER(TRIM(sku)) = ${normalizedSku}
          AND year = ${year}
          AND month = ${month}
      `;

      if (existing.rows.length > 0) {
        await sql`
          UPDATE historical_sales
          SET quantity = ${quantity}, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${existing.rows[0].id}
        `;
      } else {
        await sql`
          INSERT INTO historical_sales (sku, year, month, quantity)
          VALUES (${normalizedSku}, ${year}, ${month}, ${quantity})
        `;
      }
      return Response.json({ success: true, message: `Zaktualizowano ${sku}` });
    }

    return Response.json({ success: false, error: 'Nieznana akcja' }, { status: 400 });
  } catch (error) {
    console.error('Error updating historical sales:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - Delete specific record or all data for a month
export async function DELETE(request) {
  try {
    const hasAccess = await checkITAdminAccess();
    if (!hasAccess) {
      return Response.json({ success: false, error: 'Brak dostępu. Tylko IT Administrator.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year'));
    const month = parseInt(searchParams.get('month'));
    const sku = searchParams.get('sku');

    if (sku) {
      // Delete specific SKU
      await sql`
        DELETE FROM historical_sales
        WHERE UPPER(TRIM(sku)) = ${sku.toUpperCase().trim()}
          AND year = ${year}
          AND month = ${month}
      `;
      return Response.json({ success: true, message: `Usunięto ${sku}` });
    } else if (year && month) {
      // Delete all data for month
      await sql`
        DELETE FROM historical_sales
        WHERE year = ${year} AND month = ${month}
      `;
      return Response.json({ success: true, message: `Usunięto dane dla ${month}/${year}` });
    }

    return Response.json({ success: false, error: 'Brak parametrów' }, { status: 400 });
  } catch (error) {
    console.error('Error deleting historical sales:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
