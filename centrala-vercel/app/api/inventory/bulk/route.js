import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

// POST - bulk import wielu pozycji
export async function POST(request) {
  try {
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

    let imported = 0;
    let errors = [];

    for (const item of items) {
      try {
        if (!item.sku || !item.nazwa) {
          errors.push(`Brak SKU lub nazwy: ${JSON.stringify(item)}`);
          continue;
        }

        await sql`
          INSERT INTO inventory (sku, nazwa, ean, stan, cena, czas_produkcji, jednostka, kategoria)
          VALUES (${item.sku}, ${item.nazwa}, ${item.ean || null}, ${item.stan || 0}, ${item.cena || 0}, ${item.czas_produkcji || 0}, ${item.jednostka || 'szt'}, ${kategoria})
          ON CONFLICT (sku, kategoria) DO UPDATE SET
            nazwa = EXCLUDED.nazwa,
            ean = EXCLUDED.ean,
            stan = EXCLUDED.stan,
            cena = EXCLUDED.cena,
            czas_produkcji = EXCLUDED.czas_produkcji,
            jednostka = EXCLUDED.jednostka,
            updated_at = CURRENT_TIMESTAMP
        `;
        imported++;
      } catch (err) {
        errors.push(`Blad dla ${item.sku}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported,
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
