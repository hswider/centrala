import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { initDatabase, logInventoryChange } from '../../../../lib/db';

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

// POST - bulk import wielu pozycji
export async function POST(request) {
  try {
    // Ensure database migrations are run (e.g. tkanina column)
    await initDatabase();

    const body = await request.json();
    const { items, kategoria } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Wymagane pole: items (tablica)' },
        { status: 400 }
      );
    }

    if (!kategoria) {
      return NextResponse.json(
        { success: false, error: 'Wymagane pole: kategoria' },
        { status: 400 }
      );
    }

    const { userId, username } = await getCurrentUser();
    let imported = 0;
    let updated = 0;
    let errors = [];

    for (const item of items) {
      try {
        if (!item.sku || !item.nazwa) {
          errors.push(`Brak SKU lub nazwy: ${JSON.stringify(item)}`);
          continue;
        }

        // Check if item exists
        const existing = await sql`
          SELECT * FROM inventory WHERE sku = ${item.sku} AND kategoria = ${kategoria}
        `;
        const oldItem = existing.rows[0];

        const result = await sql`
          INSERT INTO inventory (sku, nazwa, ean, stan, cena, czas_produkcji, jednostka, kategoria, tkanina)
          VALUES (${item.sku}, ${item.nazwa}, ${item.ean || null}, ${item.stan || 0}, ${item.cena || 0}, ${item.czas_produkcji || 0}, ${item.jednostka || 'szt'}, ${kategoria}, ${item.tkanina || null})
          ON CONFLICT (sku, kategoria) DO UPDATE SET
            nazwa = EXCLUDED.nazwa,
            ean = EXCLUDED.ean,
            stan = EXCLUDED.stan,
            cena = EXCLUDED.cena,
            czas_produkcji = EXCLUDED.czas_produkcji,
            jednostka = EXCLUDED.jednostka,
            tkanina = EXCLUDED.tkanina,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `;

        const newItem = result.rows[0];

        // Log changes
        if (oldItem) {
          // Existing item - log changes
          if (parseFloat(oldItem.stan) !== parseFloat(newItem.stan)) {
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
              source: 'CSV_IMPORT'
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
              source: 'CSV_IMPORT'
            });
          }
          // Log EAN change
          if ((oldItem.ean || '') !== (newItem.ean || '')) {
            await logInventoryChange({
              inventoryId: newItem.id,
              sku: newItem.sku,
              nazwa: newItem.nazwa,
              kategoria: newItem.kategoria,
              actionType: 'PRODUCT_MODIFY',
              fieldChanged: 'ean',
              oldValue: oldItem.ean || '(brak)',
              newValue: newItem.ean || '(brak)',
              userId,
              username,
              source: 'CSV_IMPORT'
            });
          }
          // Log nazwa change
          if (oldItem.nazwa !== newItem.nazwa) {
            await logInventoryChange({
              inventoryId: newItem.id,
              sku: newItem.sku,
              nazwa: newItem.nazwa,
              kategoria: newItem.kategoria,
              actionType: 'PRODUCT_MODIFY',
              fieldChanged: 'nazwa',
              oldValue: oldItem.nazwa,
              newValue: newItem.nazwa,
              userId,
              username,
              source: 'CSV_IMPORT'
            });
          }
          // Log tkanina change
          if ((oldItem.tkanina || '') !== (newItem.tkanina || '')) {
            await logInventoryChange({
              inventoryId: newItem.id,
              sku: newItem.sku,
              nazwa: newItem.nazwa,
              kategoria: newItem.kategoria,
              actionType: 'PRODUCT_MODIFY',
              fieldChanged: 'tkanina',
              oldValue: oldItem.tkanina || '(brak)',
              newValue: newItem.tkanina || '(brak)',
              userId,
              username,
              source: 'CSV_IMPORT'
            });
          }
          updated++;
        } else {
          // New item
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
            source: 'CSV_IMPORT'
          });
          imported++;
        }
      } catch (err) {
        errors.push(`Blad dla ${item.sku}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      updated,
      total: items.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Inventory bulk POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
