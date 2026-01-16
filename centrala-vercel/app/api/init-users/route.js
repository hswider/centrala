import { NextResponse } from 'next/server';
import { createUser, initDatabase } from '../../../lib/db';

export async function POST(request) {
  try {
    // Ensure database is initialized
    await initDatabase();

    // Create Administrator user
    const admin = await createUser('Administrator', 'POOM1234!@', 'admin');

    // Create hswider user - admin role but without MES access
    const hswiderPermissions = ['dashboard', 'oms', 'wms', 'crm', 'agent', 'admin'];
    const hswider = await createUser('hswider', 'POOM1234!@', 'admin', hswiderPermissions);

    return NextResponse.json({
      success: true,
      message: 'Users initialized successfully',
      users: [
        { username: admin.username, role: admin.role, permissions: admin.permissions },
        { username: hswider.username, role: hswider.role, permissions: hswider.permissions }
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

    // Create hswider user - admin role but without MES access
    const hswiderPermissions = ['dashboard', 'oms', 'wms', 'crm', 'agent', 'admin'];
    const hswider = await createUser('hswider', 'POOM1234!@', 'admin', hswiderPermissions);

    return NextResponse.json({
      success: true,
      message: 'Users initialized successfully',
      users: [
        { username: admin.username, role: admin.role, permissions: admin.permissions },
        { username: hswider.username, role: hswider.role, permissions: hswider.permissions }
      ]
    });
  } catch (error) {
    console.error('Init users error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
