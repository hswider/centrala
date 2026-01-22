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
        created_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Add created_by column if it doesn't exist
    await sql`
      ALTER TABLE generated_documents
      ADD COLUMN IF NOT EXISTS created_by VARCHAR(100)
    `;

    // Create document_history table for audit log
    await sql`
      CREATE TABLE IF NOT EXISTS document_history (
        id SERIAL PRIMARY KEY,
        document_id INTEGER REFERENCES generated_documents(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL,
        action_details JSONB,
        user_name VARCHAR(100) NOT NULL,
        user_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    return NextResponse.json({
      success: true,
      message: 'DMS tables created successfully (generated_documents + document_history)'
    });
  } catch (error) {
    console.error('Init DMS error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
