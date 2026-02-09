import { sql } from '@vercel/postgres';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('poom_user')?.value;

    let cookieData = null;
    if (userCookie) {
      try {
        cookieData = JSON.parse(userCookie);
      } catch (e) {
        cookieData = { error: 'Failed to parse cookie', raw: userCookie };
      }
    }

    // Get all users with it_administrator role
    const { rows: itAdmins } = await sql`
      SELECT id, username, role, permissions FROM users WHERE role = 'it_administrator'
    `;

    // Get user by username from cookie if exists
    let dbUser = null;
    if (cookieData?.username) {
      const { rows } = await sql`
        SELECT id, username, role, permissions FROM users WHERE username = ${cookieData.username}
      `;
      dbUser = rows[0] || null;
    }

    return Response.json({
      success: true,
      cookie: cookieData,
      dbUser,
      itAdmins,
      check: {
        hasCookie: !!userCookie,
        cookieRole: cookieData?.role,
        dbRole: dbUser?.role,
        isITAdmin: cookieData?.role === 'it_administrator'
      }
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
