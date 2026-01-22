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

// GET - list all documents
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const docType = searchParams.get('type');
    const status = searchParams.get('status');

    let query = `
      SELECT * FROM generated_documents
      WHERE 1=1
    `;

    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(customer_name ILIKE $${paramIndex} OR doc_number ILIKE $${paramIndex} OR order_id ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (docType) {
      conditions.push(`doc_type = $${paramIndex}`);
      values.push(docType);
      paramIndex++;
    }

    if (status) {
      conditions.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const { rows } = await sql.query(query, values);

    return NextResponse.json({
      success: true,
      documents: rows
    });
  } catch (error) {
    console.error('Get documents error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - create new document
export async function POST(request) {
  try {
    const body = await request.json();
    const { docType, docNumber, orderId, customerName, data, status = 'draft', userName, userId } = body;

    const { rows } = await sql`
      INSERT INTO generated_documents (doc_type, doc_number, order_id, customer_name, data, status, created_by)
      VALUES (${docType}, ${docNumber}, ${orderId}, ${customerName}, ${JSON.stringify(data)}, ${status}, ${userName || null})
      RETURNING *
    `;

    const document = rows[0];

    // Log history
    await logHistory(document.id, 'created', {
      docType,
      docNumber,
      customerName,
      orderId
    }, userName, userId);

    return NextResponse.json({
      success: true,
      document
    });
  } catch (error) {
    console.error('Create document error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
