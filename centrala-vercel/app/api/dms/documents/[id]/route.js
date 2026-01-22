import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// GET - get single document
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const { rows } = await sql`
      SELECT * FROM generated_documents WHERE id = ${id}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      document: rows[0]
    });
  } catch (error) {
    console.error('Get document error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT - update document
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { docNumber, customerName, data, status } = body;

    const { rows } = await sql`
      UPDATE generated_documents
      SET
        doc_number = COALESCE(${docNumber}, doc_number),
        customer_name = COALESCE(${customerName}, customer_name),
        data = COALESCE(${data ? JSON.stringify(data) : null}, data),
        status = COALESCE(${status}, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      document: rows[0]
    });
  } catch (error) {
    console.error('Update document error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - delete document
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const { rows } = await sql`
      DELETE FROM generated_documents WHERE id = ${id} RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
