import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST() {
  try {
    // Create generated_documents table
    await sql`
      CREATE TABLE IF NOT EXISTS generated_documents (
        id SERIAL PRIMARY KEY,
        doc_type VARCHAR(50) NOT NULL,
        doc_number VARCHAR(100),
        order_id VARCHAR(50),
        customer_name VARCHAR(255),
        data JSONB NOT NULL,
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    return NextResponse.json({
      success: true,
      message: 'Generated documents table created successfully'
    });
  } catch (error) {
    console.error('Init DMS error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
