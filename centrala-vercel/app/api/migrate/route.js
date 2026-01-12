import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

// GET - wykonaj migracje bazy danych
export async function GET() {
  try {
    const results = [];

    // Dodaj kolumne czas_produkcji do inventory
    try {
      await sql`
        ALTER TABLE inventory ADD COLUMN IF NOT EXISTS czas_produkcji INTEGER DEFAULT 0
      `;
      results.push('Dodano kolumne czas_produkcji');
    } catch (e) {
      results.push('Kolumna czas_produkcji juz istnieje lub blad: ' + e.message);
    }

    // Dodaj kolumne ean do inventory (EAN-13, opcjonalne)
    try {
      await sql`
        ALTER TABLE inventory ADD COLUMN IF NOT EXISTS ean VARCHAR(13) DEFAULT NULL
      `;
      results.push('Dodano kolumne ean');
    } catch (e) {
      results.push('Kolumna ean juz istnieje lub blad: ' + e.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Migracja zakonczona',
      results
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
