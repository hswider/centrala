import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { initDatabase, logInventoryChange } from '../../../lib/db';

// Helper to get current user from cookies
async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('poom_user');
    if (userCookie) {
      const user = JSON.parse(userCookie.value);
      return { userId: user.id, username: user.username };
    }
  } catch (e) {
    console.error('Error getting user from cookie:', e);
  }
  return { userId: null, username: null };
}

// Stala stawki minutowej (najnizsza krajowa 3606 PLN / 168h / 60min)
const MINUTE_RATE = 0.358;

// GET - pobierz wszystkie pozycje (opcjonalnie filtruj po kategorii)
export async function GET(request) {
  try {
    // Ensure database migrations are run (e.g. tkanina column)
    await initDatabase();

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
          tkanina: row.tkanina || '',
          yellow_threshold: row.yellow_threshold != null ? parseInt(row.yellow_threshold) : null,
          red_threshold: row.red_threshold != null ? parseInt(row.red_threshold) : null,
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
    const { sku, nazwa, stan, cena, kategoria, czas_produkcji, ean, jednostka, tkanina } = body;

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

    // Check if product already exists (for logging purposes)
    const existing = await sql`
      SELECT * FROM inventory WHERE sku = ${sku} AND kategoria = ${kategoria}
    `;
    const isUpdate = existing.rows.length > 0;

    const result = await sql`
      INSERT INTO inventory (sku, nazwa, stan, cena, kategoria, czas_produkcji, ean, jednostka, tkanina)
      VALUES (${sku}, ${nazwa}, ${stan || 0}, ${cena || 0}, ${kategoria}, ${czas_produkcji || 0}, ${ean || null}, ${jednostka || 'szt'}, ${tkanina || null})
      ON CONFLICT (sku, kategoria) DO UPDATE SET
        nazwa = EXCLUDED.nazwa,
        stan = EXCLUDED.stan,
        cena = EXCLUDED.cena,
        czas_produkcji = EXCLUDED.czas_produkcji,
        ean = EXCLUDED.ean,
        jednostka = EXCLUDED.jednostka,
        tkanina = EXCLUDED.tkanina,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    // Log the change
    const { userId, username } = await getCurrentUser();
    const newItem = result.rows[0];

    if (isUpdate) {
      const oldItem = existing.rows[0];
      // Log each changed field
      if (oldItem.stan !== newItem.stan) {
        await logInventoryChange({
          inventoryId: newItem.id,
          sku: newItem.sku,
          nazwa: newItem.nazwa,
          kategoria: newItem.kategoria,
          actionType: 'STAN_CHANGE',
          fieldChanged: 'stan',
          oldValue: String(oldItem.stan),
          newValue: String(newItem.stan),
          userId,
          username,
          source: 'MANUAL'
        });
      }
      if (parseFloat(oldItem.cena) !== parseFloat(newItem.cena)) {
        await logInventoryChange({
          inventoryId: newItem.id,
          sku: newItem.sku,
          nazwa: newItem.nazwa,
          kategoria: newItem.kategoria,
          actionType: 'PRICE_CHANGE',
          fieldChanged: 'cena',
          oldValue: String(oldItem.cena),
          newValue: String(newItem.cena),
          userId,
          username,
          source: 'MANUAL'
        });
      }
      if (oldItem.nazwa !== newItem.nazwa || oldItem.ean !== newItem.ean || oldItem.tkanina !== newItem.tkanina) {
        await logInventoryChange({
          inventoryId: newItem.id,
          sku: newItem.sku,
          nazwa: newItem.nazwa,
          kategoria: newItem.kategoria,
          actionType: 'PRODUCT_MODIFY',
          fieldChanged: 'dane',
          oldValue: JSON.stringify({ nazwa: oldItem.nazwa, ean: oldItem.ean, tkanina: oldItem.tkanina }),
          newValue: JSON.stringify({ nazwa: newItem.nazwa, ean: newItem.ean, tkanina: newItem.tkanina }),
          userId,
          username,
          source: 'MANUAL'
        });
      }
    } else {
      // New product
      await logInventoryChange({
        inventoryId: newItem.id,
        sku: newItem.sku,
        nazwa: newItem.nazwa,
        kategoria: newItem.kategoria,
        actionType: 'PRODUCT_ADD',
        fieldChanged: null,
        oldValue: null,
        newValue: JSON.stringify({ stan: newItem.stan, cena: newItem.cena }),
        userId,
        username,
        source: 'MANUAL'
      });
    }

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

// PUT - aktualizuj pozycje (stan, cena, czas_produkcji, ean, jednostka, tkanina lub dane)
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, sku, nazwa, stan, cena, czas_produkcji, ean, jednostka, tkanina } = body;

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

    // Get old values for logging
    const oldResult = await sql`SELECT * FROM inventory WHERE id = ${id}`;
    const oldItem = oldResult.rows[0];

    if (!oldItem) {
      return NextResponse.json(
        { success: false, error: 'Nie znaleziono pozycji' },
        { status: 404 }
      );
    }

    // Aktualizuj tylko przekazane pola
    let result;

    // Pelna aktualizacja z wszystkimi polami
    if (sku !== undefined && nazwa !== undefined && stan !== undefined && cena !== undefined) {
      result = await sql`
        UPDATE inventory
        SET sku = ${sku}, nazwa = ${nazwa}, stan = ${stan}, cena = ${cena},
            czas_produkcji = ${czas_produkcji || 0}, ean = ${ean || null}, jednostka = ${jednostka || 'szt'},
            tkanina = ${tkanina || null}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (sku !== undefined && nazwa !== undefined && stan !== undefined) {
      result = await sql`
        UPDATE inventory
        SET sku = ${sku}, nazwa = ${nazwa}, stan = ${stan}, ean = ${ean || null}, jednostka = ${jednostka || 'szt'},
            tkanina = ${tkanina || null}, updated_at = CURRENT_TIMESTAMP
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
    } else if (tkanina !== undefined) {
      // Tylko aktualizacja tkaniny
      result = await sql`
        UPDATE inventory
        SET tkanina = ${tkanina || null}, updated_at = CURRENT_TIMESTAMP
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
    } else if (body.yellow_threshold !== undefined || body.red_threshold !== undefined) {
      // Aktualizacja progow kolorow
      const yellowThreshold = body.yellow_threshold !== undefined ? (body.yellow_threshold === null ? null : parseInt(body.yellow_threshold)) : oldItem.yellow_threshold;
      const redThreshold = body.red_threshold !== undefined ? (body.red_threshold === null ? null : parseInt(body.red_threshold)) : oldItem.red_threshold;
      result = await sql`
        UPDATE inventory
        SET yellow_threshold = ${yellowThreshold}, red_threshold = ${redThreshold}, updated_at = CURRENT_TIMESTAMP
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

    // Log the changes
    const { userId, username } = await getCurrentUser();
    const newItem = result.rows[0];

    // Log stock change
    if (stan !== undefined && parseFloat(oldItem.stan) !== parseFloat(newItem.stan)) {
      await logInventoryChange({
        inventoryId: newItem.id,
        sku: newItem.sku,
        nazwa: newItem.nazwa,
        kategoria: newItem.kategoria,
        actionType: 'STAN_CHANGE',
        fieldChanged: 'stan',
        oldValue: String(oldItem.stan),
        newValue: String(newItem.stan),
        userId,
        username,
        source: 'MANUAL'
      });
    }

    // Log price change
    if (cena !== undefined && parseFloat(oldItem.cena) !== parseFloat(newItem.cena)) {
      await logInventoryChange({
        inventoryId: newItem.id,
        sku: newItem.sku,
        nazwa: newItem.nazwa,
        kategoria: newItem.kategoria,
        actionType: 'PRICE_CHANGE',
        fieldChanged: 'cena',
        oldValue: String(oldItem.cena),
        newValue: String(newItem.cena),
        userId,
        username,
        source: 'MANUAL'
      });
    }

    // Log other changes (nazwa, ean, tkanina, etc.)
    const hasOtherChanges =
      (nazwa !== undefined && oldItem.nazwa !== newItem.nazwa) ||
      (ean !== undefined && oldItem.ean !== newItem.ean) ||
      (tkanina !== undefined && oldItem.tkanina !== newItem.tkanina) ||
      (sku !== undefined && oldItem.sku !== newItem.sku);

    if (hasOtherChanges) {
      await logInventoryChange({
        inventoryId: newItem.id,
        sku: newItem.sku,
        nazwa: newItem.nazwa,
        kategoria: newItem.kategoria,
        actionType: 'PRODUCT_MODIFY',
        fieldChanged: 'dane',
        oldValue: JSON.stringify({ sku: oldItem.sku, nazwa: oldItem.nazwa, ean: oldItem.ean, tkanina: oldItem.tkanina }),
        newValue: JSON.stringify({ sku: newItem.sku, nazwa: newItem.nazwa, ean: newItem.ean, tkanina: newItem.tkanina }),
        userId,
        username,
        source: 'MANUAL'
      });
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

    // Log the deletion
    const { userId, username } = await getCurrentUser();
    const deletedItem = result.rows[0];

    await logInventoryChange({
      inventoryId: deletedItem.id,
      sku: deletedItem.sku,
      nazwa: deletedItem.nazwa,
      kategoria: deletedItem.kategoria,
      actionType: 'PRODUCT_DELETE',
      fieldChanged: null,
      oldValue: JSON.stringify({ stan: deletedItem.stan, cena: deletedItem.cena }),
      newValue: null,
      userId,
      username,
      source: 'MANUAL'
    });

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
