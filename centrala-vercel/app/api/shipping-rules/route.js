import { sql } from '@vercel/postgres';
import { cookies } from 'next/headers';
import { initDatabase } from '../../../lib/db';

async function checkAccess() {
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

// GET - List all active shipping rules
export async function GET() {
  try {
    await initDatabase();
    const { rows } = await sql`
      SELECT * FROM shipping_rules
      WHERE is_active = true
      ORDER BY priority DESC, id ASC
    `;
    return Response.json({ success: true, rules: rows });
  } catch (error) {
    console.error('Error fetching shipping rules:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Create new rule
export async function POST(request) {
  try {
    const hasAccess = await checkAccess();
    if (!hasAccess) {
      return Response.json({ success: false, error: 'Brak dostepu' }, { status: 403 });
    }

    await initDatabase();
    const body = await request.json();

    const {
      name,
      priority,
      channel_pattern,
      sku_pattern,
      carrier_account_id,
      carrier_account_name,
      method_uuid,
      weight_kg
    } = body;

    if (!name || !carrier_account_id) {
      return Response.json({ success: false, error: 'Nazwa i konto kuriera sa wymagane' }, { status: 400 });
    }

    const { rows } = await sql`
      INSERT INTO shipping_rules (
        name, priority, channel_pattern, sku_pattern,
        carrier_account_id, carrier_account_name, method_uuid, weight_kg
      ) VALUES (
        ${name}, ${priority || 0}, ${channel_pattern || null}, ${sku_pattern || null},
        ${carrier_account_id}, ${carrier_account_name || null}, ${method_uuid || null},
        ${weight_kg || 1}
      )
      RETURNING *
    `;

    return Response.json({ success: true, rule: rows[0] });
  } catch (error) {
    console.error('Error creating shipping rule:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT - Update rule
export async function PUT(request) {
  try {
    const hasAccess = await checkAccess();
    if (!hasAccess) {
      return Response.json({ success: false, error: 'Brak dostepu' }, { status: 403 });
    }

    await initDatabase();
    const body = await request.json();

    const {
      id,
      name,
      priority,
      channel_pattern,
      sku_pattern,
      carrier_account_id,
      carrier_account_name,
      method_uuid,
      weight_kg
    } = body;

    if (!id) {
      return Response.json({ success: false, error: 'ID reguly jest wymagane' }, { status: 400 });
    }

    const { rows } = await sql`
      UPDATE shipping_rules SET
        name = COALESCE(${name}, name),
        priority = COALESCE(${priority}, priority),
        channel_pattern = ${channel_pattern !== undefined ? channel_pattern || null : null},
        sku_pattern = ${sku_pattern !== undefined ? sku_pattern || null : null},
        carrier_account_id = COALESCE(${carrier_account_id}, carrier_account_id),
        carrier_account_name = COALESCE(${carrier_account_name}, carrier_account_name),
        method_uuid = ${method_uuid !== undefined ? method_uuid || null : null},
        weight_kg = COALESCE(${weight_kg}, weight_kg),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND is_active = true
      RETURNING *
    `;

    if (rows.length === 0) {
      return Response.json({ success: false, error: 'Regula nie znaleziona' }, { status: 404 });
    }

    return Response.json({ success: true, rule: rows[0] });
  } catch (error) {
    console.error('Error updating shipping rule:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - Soft delete rule
export async function DELETE(request) {
  try {
    const hasAccess = await checkAccess();
    if (!hasAccess) {
      return Response.json({ success: false, error: 'Brak dostepu' }, { status: 403 });
    }

    await initDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ success: false, error: 'ID reguly jest wymagane' }, { status: 400 });
    }

    await sql`UPDATE shipping_rules SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting shipping rule:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
