import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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

// Initialize documents table if it doesn't exist
async function initDocumentsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS warehouse_documents (
        id SERIAL PRIMARY KEY,
        typ VARCHAR(10) NOT NULL,
        numer VARCHAR(100) NOT NULL,
        firma VARCHAR(255),
        pozycje JSONB,
        user_id INTEGER,
        username VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
  } catch (error) {
    console.error('Error creating documents table:', error);
  }
}

// GET - pobierz liste dokumentow
export async function GET(request) {
  try {
    await initDocumentsTable();

    const { searchParams } = new URL(request.url);
    const typ = searchParams.get('typ');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '50');
    const offset = (page - 1) * perPage;

    let result;
    let countResult;

    if (typ) {
      result = await sql`
        SELECT * FROM warehouse_documents
        WHERE typ = ${typ}
        ORDER BY created_at DESC
        LIMIT ${perPage} OFFSET ${offset}
      `;
      countResult = await sql`SELECT COUNT(*) as total FROM warehouse_documents WHERE typ = ${typ}`;
    } else {
      result = await sql`
        SELECT * FROM warehouse_documents
        ORDER BY created_at DESC
        LIMIT ${perPage} OFFSET ${offset}
      `;
      countResult = await sql`SELECT COUNT(*) as total FROM warehouse_documents`;
    }

    const total = parseInt(countResult.rows[0]?.total || 0);

    return NextResponse.json({
      success: true,
      documents: result.rows,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage)
      }
    });
  } catch (error) {
    console.error('Documents GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - zapisz nowy dokument
export async function POST(request) {
  try {
    await initDocumentsTable();

    const body = await request.json();
    const { typ, numer, firma, pozycje } = body;

    if (!typ || !numer) {
      return NextResponse.json(
        { success: false, error: 'Wymagane pola: typ, numer' },
        { status: 400 }
      );
    }

    const { userId, username } = await getCurrentUser();

    const result = await sql`
      INSERT INTO warehouse_documents (typ, numer, firma, pozycje, user_id, username)
      VALUES (${typ}, ${numer}, ${firma || null}, ${JSON.stringify(pozycje || [])}, ${userId}, ${username})
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      document: result.rows[0]
    });
  } catch (error) {
    console.error('Documents POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
