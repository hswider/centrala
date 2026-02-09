import { sql } from '@vercel/postgres';
import { cookies } from 'next/headers';
import { initDatabase } from '../../../../lib/db';

// Check admin access
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

// GET - List all templates
export async function GET() {
  try {
    await initDatabase();

    const { rows } = await sql`
      SELECT * FROM shipping_templates
      WHERE is_active = true
      ORDER BY courier, name
    `;

    return Response.json({ success: true, templates: rows });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Create new template
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
      courier,
      service_type,
      length_cm,
      width_cm,
      height_cm,
      weight_kg,
      content_description,
      is_default
    } = body;

    if (!name || !courier) {
      return Response.json({ success: false, error: 'Nazwa i kurier sa wymagane' }, { status: 400 });
    }

    // If setting as default, unset other defaults for this courier
    if (is_default) {
      await sql`UPDATE shipping_templates SET is_default = false WHERE courier = ${courier}`;
    }

    const { rows } = await sql`
      INSERT INTO shipping_templates (
        name, courier, service_type,
        length_cm, width_cm, height_cm, weight_kg,
        content_description, is_default
      ) VALUES (
        ${name}, ${courier}, ${service_type || null},
        ${length_cm || 30}, ${width_cm || 20}, ${height_cm || 10}, ${weight_kg || 1},
        ${content_description || null}, ${is_default || false}
      )
      RETURNING *
    `;

    return Response.json({ success: true, template: rows[0] });
  } catch (error) {
    console.error('Error creating template:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT - Update template
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
      courier,
      service_type,
      length_cm,
      width_cm,
      height_cm,
      weight_kg,
      content_description,
      is_default
    } = body;

    if (!id) {
      return Response.json({ success: false, error: 'ID szablonu jest wymagane' }, { status: 400 });
    }

    // If setting as default, unset other defaults for this courier
    if (is_default && courier) {
      await sql`UPDATE shipping_templates SET is_default = false WHERE courier = ${courier} AND id != ${id}`;
    }

    const { rows } = await sql`
      UPDATE shipping_templates SET
        name = COALESCE(${name}, name),
        courier = COALESCE(${courier}, courier),
        service_type = COALESCE(${service_type}, service_type),
        length_cm = COALESCE(${length_cm}, length_cm),
        width_cm = COALESCE(${width_cm}, width_cm),
        height_cm = COALESCE(${height_cm}, height_cm),
        weight_kg = COALESCE(${weight_kg}, weight_kg),
        content_description = COALESCE(${content_description}, content_description),
        is_default = COALESCE(${is_default}, is_default)
      WHERE id = ${id}
      RETURNING *
    `;

    if (rows.length === 0) {
      return Response.json({ success: false, error: 'Szablon nie znaleziony' }, { status: 404 });
    }

    return Response.json({ success: true, template: rows[0] });
  } catch (error) {
    console.error('Error updating template:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - Delete template (soft delete)
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
      return Response.json({ success: false, error: 'ID szablonu jest wymagane' }, { status: 400 });
    }

    await sql`UPDATE shipping_templates SET is_active = false WHERE id = ${id}`;

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
