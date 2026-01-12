import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

// GET - pobierz wszystkie pozycje (opcjonalnie filtruj po kategorii)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const kategoria = searchParams.get('kategoria');
    const search = searchParams.get('search');

    let result;

    if (kategoria && search) {
      const searchPattern = `%${search}%`;
      result = await sql`
        SELECT * FROM inventory
        WHERE kategoria = ${kategoria}
          AND (sku ILIKE ${searchPattern} OR nazwa ILIKE ${searchPattern})
        ORDER BY nazwa ASC
      `;
    } else if (kategoria) {
      result = await sql`
        SELECT * FROM inventory
        WHERE kategoria = ${kategoria}
        ORDER BY nazwa ASC
      `;
    } else if (search) {
      const searchPattern = `%${search}%`;
      result = await sql`
        SELECT * FROM inventory
        WHERE sku ILIKE ${searchPattern} OR nazwa ILIKE ${searchPattern}
        ORDER BY kategoria, nazwa ASC
      `;
    } else {
      result = await sql`
        SELECT * FROM inventory
        ORDER BY kategoria, nazwa ASC
      `;
    }

    // Grupuj po kategorii
    const grouped = {
      gotowe: [],
      polprodukty: [],
      wykroje: [],
      surowce: []
    };

    result.rows.forEach(row => {
      if (grouped[row.kategoria]) {
        grouped[row.kategoria].push({
          id: row.id,
          sku: row.sku,
          nazwa: row.nazwa,
          stan: row.stan,
          updatedAt: row.updated_at
        });
      }
    });

    return NextResponse.json({
      success: true,
      data: grouped,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Inventory GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - dodaj nowa pozycje
export async function POST(request) {
  try {
    const body = await request.json();
    const { sku, nazwa, stan, kategoria } = body;

    if (!sku || !nazwa || !kategoria) {
      return NextResponse.json(
        { success: false, error: 'Wymagane pola: sku, nazwa, kategoria' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO inventory (sku, nazwa, stan, kategoria)
      VALUES (${sku}, ${nazwa}, ${stan || 0}, ${kategoria})
      ON CONFLICT (sku, kategoria) DO UPDATE SET
        nazwa = EXCLUDED.nazwa,
        stan = EXCLUDED.stan,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Inventory POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - aktualizuj pozycje (stan lub dane)
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, sku, nazwa, stan } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Wymagane pole: id' },
        { status: 400 }
      );
    }

    // Aktualizuj tylko przekazane pola
    let result;

    if (sku !== undefined && nazwa !== undefined && stan !== undefined) {
      result = await sql`
        UPDATE inventory
        SET sku = ${sku}, nazwa = ${nazwa}, stan = ${stan}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (stan !== undefined) {
      // Tylko aktualizacja stanu
      result = await sql`
        UPDATE inventory
        SET stan = ${stan}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (nazwa !== undefined) {
      result = await sql`
        UPDATE inventory
        SET nazwa = ${nazwa}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else {
      return NextResponse.json(
        { success: false, error: 'Brak danych do aktualizacji' },
        { status: 400 }
      );
    }

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nie znaleziono pozycji' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Inventory PUT error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - usun pozycje
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
      DELETE FROM inventory WHERE id = ${id}
      RETURNING *
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nie znaleziono pozycji' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted: result.rows[0]
    });
  } catch (error) {
    console.error('Inventory DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
