import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

// POST - bulk delete wielu pozycji
export async function POST(request) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Wymagane pole: ids (tablica)' },
        { status: 400 }
      );
    }

    let deleted = 0;
    let errors = [];

    for (const id of ids) {
      try {
        await sql`DELETE FROM inventory WHERE id = ${id}`;
        deleted++;
      } catch (err) {
        errors.push(`Blad dla ID ${id}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      deleted,
      total: ids.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Inventory bulk-delete error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
