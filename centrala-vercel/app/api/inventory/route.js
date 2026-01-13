import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

// Stala stawki minutowej (najnizsza krajowa 3606 PLN / 168h / 60min)
const MINUTE_RATE = 0.358;

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

    // Pobierz koszty skladnikow dla gotowych produktow
    const recipeCosts = await sql`
      SELECT
        r.product_id,
        COALESCE(SUM(r.quantity * i.cena), 0) as ingredients_cost
      FROM recipes r
      JOIN inventory i ON r.ingredient_id = i.id
      GROUP BY r.product_id
    `;

    // Mapa kosztow skladnikow
    const ingredientsCostMap = {};
    recipeCosts.rows.forEach(row => {
      ingredientsCostMap[row.product_id] = parseFloat(row.ingredients_cost) || 0;
    });

    // Grupuj po kategorii
    const grouped = {
      gotowe: [],
      polprodukty: [],
      wykroje: [],
      surowce: []
    };

    result.rows.forEach(row => {
      if (grouped[row.kategoria]) {
        const item = {
          id: row.id,
          sku: row.sku,
          nazwa: row.nazwa,
          ean: row.ean || '',
          stan: parseFloat(row.stan) || 0,
          cena: parseFloat(row.cena) || 0,
          czas_produkcji: parseInt(row.czas_produkcji) || 0,
          jednostka: row.jednostka || 'szt',
          updatedAt: row.updated_at
        };

        // Dla gotowych produktow oblicz koszt wytworzenia
        if (row.kategoria === 'gotowe') {
          const ingredientsCost = ingredientsCostMap[row.id] || 0;
          const laborCost = (parseInt(row.czas_produkcji) || 0) * MINUTE_RATE;
          item.koszt_wytworzenia = ingredientsCost + laborCost;
          item.koszt_skladnikow = ingredientsCost;
          item.koszt_pracy = laborCost;
        }

        grouped[row.kategoria].push(item);
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
    const { sku, nazwa, stan, cena, kategoria, czas_produkcji, ean, jednostka } = body;

    if (!sku || !nazwa || !kategoria) {
      return NextResponse.json(
        { success: false, error: 'Wymagane pola: sku, nazwa, kategoria' },
        { status: 400 }
      );
    }

    // Walidacja EAN - jesli podany, musi miec 13 cyfr
    if (ean && !/^\d{13}$/.test(ean)) {
      return NextResponse.json(
        { success: false, error: 'EAN musi skladac sie z dokladnie 13 cyfr' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO inventory (sku, nazwa, stan, cena, kategoria, czas_produkcji, ean, jednostka)
      VALUES (${sku}, ${nazwa}, ${stan || 0}, ${cena || 0}, ${kategoria}, ${czas_produkcji || 0}, ${ean || null}, ${jednostka || 'szt'})
      ON CONFLICT (sku, kategoria) DO UPDATE SET
        nazwa = EXCLUDED.nazwa,
        stan = EXCLUDED.stan,
        cena = EXCLUDED.cena,
        czas_produkcji = EXCLUDED.czas_produkcji,
        ean = EXCLUDED.ean,
        jednostka = EXCLUDED.jednostka,
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

// PUT - aktualizuj pozycje (stan, cena, czas_produkcji, ean, jednostka lub dane)
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, sku, nazwa, stan, cena, czas_produkcji, ean, jednostka } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Wymagane pole: id' },
        { status: 400 }
      );
    }

    // Walidacja EAN - jesli podany, musi miec 13 cyfr
    if (ean !== undefined && ean !== '' && ean !== null && !/^\d{13}$/.test(ean)) {
      return NextResponse.json(
        { success: false, error: 'EAN musi skladac sie z dokladnie 13 cyfr' },
        { status: 400 }
      );
    }

    // Aktualizuj tylko przekazane pola
    let result;

    // Pelna aktualizacja z wszystkimi polami
    if (sku !== undefined && nazwa !== undefined && stan !== undefined && cena !== undefined) {
      result = await sql`
        UPDATE inventory
        SET sku = ${sku}, nazwa = ${nazwa}, stan = ${stan}, cena = ${cena},
            czas_produkcji = ${czas_produkcji || 0}, ean = ${ean || null}, jednostka = ${jednostka || 'szt'}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (sku !== undefined && nazwa !== undefined && stan !== undefined) {
      result = await sql`
        UPDATE inventory
        SET sku = ${sku}, nazwa = ${nazwa}, stan = ${stan}, ean = ${ean || null}, jednostka = ${jednostka || 'szt'}, updated_at = CURRENT_TIMESTAMP
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
    } else if (cena !== undefined) {
      // Tylko aktualizacja ceny
      result = await sql`
        UPDATE inventory
        SET cena = ${cena}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (czas_produkcji !== undefined) {
      // Tylko aktualizacja czasu produkcji
      result = await sql`
        UPDATE inventory
        SET czas_produkcji = ${czas_produkcji}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (ean !== undefined) {
      // Tylko aktualizacja EAN
      result = await sql`
        UPDATE inventory
        SET ean = ${ean || null}, updated_at = CURRENT_TIMESTAMP
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
