import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

// GET - pobierz recepture dla produktu
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Wymagane pole: productId' },
        { status: 400 }
      );
    }

    const result = await sql`
      SELECT
        r.id,
        r.product_id,
        r.ingredient_id,
        r.quantity,
        i.sku,
        i.nazwa,
        i.kategoria,
        i.stan as ingredient_stan,
        i.cena as ingredient_cena
      FROM recipes r
      JOIN inventory i ON r.ingredient_id = i.id
      WHERE r.product_id = ${productId}
      ORDER BY i.nazwa ASC
    `;

    return NextResponse.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        productId: row.product_id,
        ingredientId: row.ingredient_id,
        quantity: parseFloat(row.quantity) || 1,
        sku: row.sku,
        nazwa: row.nazwa,
        kategoria: row.kategoria,
        ingredientStan: row.ingredient_stan,
        ingredientCena: parseFloat(row.ingredient_cena) || 0
      }))
    });
  } catch (error) {
    console.error('Recipes GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - dodaj skladnik do receptury
export async function POST(request) {
  try {
    const body = await request.json();
    const { productId, ingredientId, quantity } = body;

    if (!productId || !ingredientId) {
      return NextResponse.json(
        { success: false, error: 'Wymagane pola: productId, ingredientId' },
        { status: 400 }
      );
    }

    // Sprawdz czy skladnik nie jest tym samym produktem
    if (productId === ingredientId) {
      return NextResponse.json(
        { success: false, error: 'Produkt nie moze byc swoim wlasnym skladnikiem' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO recipes (product_id, ingredient_id, quantity)
      VALUES (${productId}, ${ingredientId}, ${quantity || 1})
      ON CONFLICT (product_id, ingredient_id) DO UPDATE SET
        quantity = EXCLUDED.quantity
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Recipes POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - aktualizuj ilosc skladnika
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, quantity } = body;

    if (!id || quantity === undefined) {
      return NextResponse.json(
        { success: false, error: 'Wymagane pola: id, quantity' },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE recipes
      SET quantity = ${quantity}
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nie znaleziono skladnika' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Recipes PUT error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - usun skladnik z receptury
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Wymagane pole: id' },
        { status: 400 }
      );
    }

    const result = await sql`
      DELETE FROM recipes WHERE id = ${id}
      RETURNING *
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nie znaleziono skladnika' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted: result.rows[0]
    });
  } catch (error) {
    console.error('Recipes DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
