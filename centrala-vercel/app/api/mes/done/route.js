import { sql } from '@vercel/postgres';
import { initDatabase } from '@/lib/db';

// GET - list all done order IDs
export async function GET() {
  try {
    await initDatabase();
    const { rows } = await sql`SELECT order_id FROM mes_done_orders`;
    return Response.json({ success: true, doneOrderIds: rows.map(r => r.order_id) });
  } catch (error) {
    console.error('[MES Done] GET error:', error.message);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - toggle done status for an order
export async function POST(request) {
  try {
    await initDatabase();
    const { orderId, done } = await request.json();

    if (!orderId) {
      return Response.json({ success: false, error: 'Missing orderId' }, { status: 400 });
    }

    if (done) {
      await sql`
        INSERT INTO mes_done_orders (order_id) VALUES (${orderId})
        ON CONFLICT (order_id) DO NOTHING
      `;
    } else {
      await sql`DELETE FROM mes_done_orders WHERE order_id = ${orderId}`;
    }

    return Response.json({ success: true, orderId, done });
  } catch (error) {
    console.error('[MES Done] POST error:', error.message);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
