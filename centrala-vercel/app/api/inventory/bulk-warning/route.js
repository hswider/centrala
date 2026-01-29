import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

// POST - bulk update warning thresholds for multiple items
export async function POST(request) {
  try {
    const body = await request.json();
    const { ids, yellow_threshold, red_threshold } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Wymagane pole: ids (tablica)' },
        { status: 400 }
      );
    }

    const yellowVal = yellow_threshold === '' || yellow_threshold === null || yellow_threshold === undefined ? null : parseInt(yellow_threshold);
    const redVal = red_threshold === '' || red_threshold === null || red_threshold === undefined ? null : parseInt(red_threshold);

    let updated = 0;
    let errors = [];

    for (const id of ids) {
      try {
        await sql`UPDATE inventory SET yellow_threshold = ${yellowVal}, red_threshold = ${redVal}, updated_at = NOW() WHERE id = ${id}`;
        updated++;
      } catch (err) {
        errors.push(`Blad dla ID ${id}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      updated,
      total: ids.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Inventory bulk-warning error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
