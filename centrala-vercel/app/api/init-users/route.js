import { NextResponse } from 'next/server';
import { createUser, initDatabase } from '../../../lib/db';

export async function POST(request) {
  try {
    // Ensure database is initialized
    await initDatabase();

    // Create Administrator user
    const admin = await createUser('Administrator', 'POOM1234!@', 'admin');

    return NextResponse.json({
      success: true,
      message: 'Users initialized successfully',
      users: [
        { username: admin.username, role: admin.role }
      ]
    });
  } catch (error) {
    console.error('Init users error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Also allow GET for easy browser initialization
export async function GET() {
  try {
    await initDatabase();

    const admin = await createUser('Administrator', 'POOM1234!@', 'admin');

    return NextResponse.json({
      success: true,
      message: 'Users initialized successfully',
      users: [
        { username: admin.username, role: admin.role }
      ]
    });
  } catch (error) {
    console.error('Init users error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
