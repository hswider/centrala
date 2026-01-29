import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// Helper to log history
async function logHistory(documentId, action, actionDetails, userName, userId) {
  try {
    await sql`
      INSERT INTO document_history (document_id, action, action_details, user_name, user_id)
      VALUES (${documentId}, ${action}, ${JSON.stringify(actionDetails || {})}, ${userName || 'System'}, ${userId || null})
    `;
  } catch (error) {
    console.error('Error logging history:', error);
  }
}

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
    const { docNumber, customerName, data, status, invoiceStatus, userName, userId } = body;

    // Get current document for comparison
    const { rows: currentRows } = await sql`
      SELECT * FROM generated_documents WHERE id = ${id}
    `;

    if (currentRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    const currentDoc = currentRows[0];

    const { rows } = await sql`
      UPDATE generated_documents
      SET
        doc_number = COALESCE(${docNumber}, doc_number),
        customer_name = COALESCE(${customerName}, customer_name),
        data = COALESCE(${data ? JSON.stringify(data) : null}, data),
        status = COALESCE(${status}, status),
        invoice_status = COALESCE(${invoiceStatus}, invoice_status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    const updatedDoc = rows[0];

    // Log history based on what changed
    const changes = {};
    if (status && status !== currentDoc.status) {
      changes.statusChange = { from: currentDoc.status, to: status };
      await logHistory(id, 'status_changed', {
        from: currentDoc.status,
        to: status,
        docNumber: updatedDoc.doc_number
      }, userName, userId);
    }

    if (invoiceStatus && invoiceStatus !== currentDoc.invoice_status) {
      await logHistory(id, 'invoice_status_changed', {
        from: currentDoc.invoice_status,
        to: invoiceStatus,
        docNumber: updatedDoc.doc_number
      }, userName, userId);
    }

    if (data) {
      await logHistory(id, 'edited', {
        docNumber: updatedDoc.doc_number,
        customerName: updatedDoc.customer_name
      }, userName, userId);
    }

    return NextResponse.json({
      success: true,
      document: updatedDoc
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
    const { searchParams } = new URL(request.url);
    const userName = searchParams.get('userName');
    const userId = searchParams.get('userId');

    // Get document info before deleting
    const { rows: docRows } = await sql`
      SELECT * FROM generated_documents WHERE id = ${id}
    `;

    if (docRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    const doc = docRows[0];

    // Log history before deleting (will be orphaned but that's ok for audit)
    await logHistory(id, 'deleted', {
      docType: doc.doc_type,
      docNumber: doc.doc_number,
      customerName: doc.customer_name
    }, userName, userId ? parseInt(userId) : null);

    const { rows } = await sql`
      DELETE FROM generated_documents WHERE id = ${id} RETURNING *
    `;

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
