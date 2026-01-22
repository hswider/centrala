import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// GET - list history for all documents or specific document
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    const limit = parseInt(searchParams.get('limit')) || 50;

    let rows;
    if (documentId) {
      const result = await sql`
        SELECT h.*, d.doc_type, d.doc_number, d.customer_name
        FROM document_history h
        LEFT JOIN generated_documents d ON h.document_id = d.id
        WHERE h.document_id = ${documentId}
        ORDER BY h.created_at DESC
        LIMIT ${limit}
      `;
      rows = result.rows;
    } else {
      const result = await sql`
        SELECT h.*, d.doc_type, d.doc_number, d.customer_name
        FROM document_history h
        LEFT JOIN generated_documents d ON h.document_id = d.id
        ORDER BY h.created_at DESC
        LIMIT ${limit}
      `;
      rows = result.rows;
    }

    return NextResponse.json({
      success: true,
      history: rows
    });
  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - add history entry
export async function POST(request) {
  try {
    const body = await request.json();
    const { documentId, action, actionDetails, userName, userId } = body;

    const { rows } = await sql`
      INSERT INTO document_history (document_id, action, action_details, user_name, user_id)
      VALUES (${documentId}, ${action}, ${JSON.stringify(actionDetails || {})}, ${userName}, ${userId || null})
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      historyEntry: rows[0]
    });
  } catch (error) {
    console.error('Add history error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
