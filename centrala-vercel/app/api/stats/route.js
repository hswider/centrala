import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { initDatabase } from '@/lib/db';

// Kurs wymiany EUR -> PLN (przybliżony)
const EUR_TO_PLN = 4.35;

function convertToPln(amount, currency) {
  if (!amount) return 0;
  if (currency === 'PLN') return parseFloat(amount);
  if (currency === 'EUR') return parseFloat(amount) * EUR_TO_PLN;
  // Dla innych walut zakładamy EUR i przeliczamy na PLN
  return parseFloat(amount) * EUR_TO_PLN;
}

export async function GET() {
  try {
    await initDatabase();

    // Use Polish timezone for date calculations
    const TZ = 'Europe/Warsaw';

    // Orders today by platform (Polish timezone)
    const todayByPlatform = await sql`
      SELECT channel_platform as platform, COUNT(*) as count
      FROM orders
      WHERE ordered_at >= (CURRENT_DATE AT TIME ZONE 'Europe/Warsaw')
      GROUP BY channel_platform
      ORDER BY count DESC
    `;

    // Orders last 30 days by platform
    const last30DaysByPlatform = await sql`
      SELECT channel_platform as platform, COUNT(*) as count
      FROM orders
      WHERE ordered_at >= (CURRENT_DATE AT TIME ZONE 'Europe/Warsaw') - INTERVAL '30 days'
      GROUP BY channel_platform
      ORDER BY count DESC
    `;

    // Orders today total (Polish timezone)
    const ordersToday = await sql`
      SELECT COUNT(*) as count FROM orders
      WHERE ordered_at >= (CURRENT_DATE AT TIME ZONE 'Europe/Warsaw')
    `;

    // Orders yesterday total (Polish timezone)
    const ordersYesterday = await sql`
      SELECT COUNT(*) as count FROM orders
      WHERE ordered_at >= (CURRENT_DATE AT TIME ZONE 'Europe/Warsaw') - INTERVAL '1 day'
        AND ordered_at < (CURRENT_DATE AT TIME ZONE 'Europe/Warsaw')
    `;

    // Shipped today (delivery_status = 13 means shipped)
    const shippedToday = await sql`
      SELECT COUNT(*) as count FROM orders
      WHERE delivery_status = 13
        AND updated_at >= (CURRENT_DATE AT TIME ZONE 'Europe/Warsaw')
    `;

    // Shipped yesterday
    const shippedYesterday = await sql`
      SELECT COUNT(*) as count FROM orders
      WHERE delivery_status = 13
        AND updated_at >= (CURRENT_DATE AT TIME ZONE 'Europe/Warsaw') - INTERVAL '1 day'
        AND updated_at < (CURRENT_DATE AT TIME ZONE 'Europe/Warsaw')
    `;

    // Total orders
    const totalOrders = await sql`
      SELECT COUNT(*) as count FROM orders
    `;

    // Revenue today by currency (Polish timezone)
    const revenueToday = await sql`
      SELECT currency, SUM(total_gross) as total
      FROM orders
      WHERE ordered_at >= (CURRENT_DATE AT TIME ZONE 'Europe/Warsaw')
      GROUP BY currency
    `;

    // Revenue last 30 days by currency
    const revenue30Days = await sql`
      SELECT currency, SUM(total_gross) as total
      FROM orders
      WHERE ordered_at >= (CURRENT_DATE AT TIME ZONE 'Europe/Warsaw') - INTERVAL '30 days'
      GROUP BY currency
    `;

    // Revenue last 30 days by day (Polish timezone)
    const revenueLast30Days = await sql`
      SELECT
        DATE(ordered_at AT TIME ZONE 'Europe/Warsaw') as date,
        currency,
        SUM(total_gross) as total
      FROM orders
      WHERE ordered_at >= (CURRENT_DATE AT TIME ZONE 'Europe/Warsaw') - INTERVAL '30 days'
      GROUP BY DATE(ordered_at AT TIME ZONE 'Europe/Warsaw'), currency
      ORDER BY date ASC
    `;

    // Orders count last 14 days by day (Polish timezone)
    const ordersLast14Days = await sql`
      SELECT
        DATE(ordered_at AT TIME ZONE 'Europe/Warsaw') as date,
        COUNT(*) as count
      FROM orders
      WHERE ordered_at >= (CURRENT_DATE AT TIME ZONE 'Europe/Warsaw') - INTERVAL '14 days'
      GROUP BY DATE(ordered_at AT TIME ZONE 'Europe/Warsaw')
      ORDER BY date ASC
    `;

    // Calculate revenue in PLN
    let revenueTodayPln = 0;
    revenueToday.rows.forEach(r => {
      revenueTodayPln += convertToPln(r.total, r.currency);
    });

    let revenue30DaysPln = 0;
    revenue30Days.rows.forEach(r => {
      revenue30DaysPln += convertToPln(r.total, r.currency);
    });

    // Top 10 products by quantity sold in last 30 days
    const topProducts = await sql`
      SELECT
        item->>'name' as name,
        item->>'sku' as sku,
        item->>'image' as image,
        SUM((item->>'quantity')::int) as total_quantity,
        SUM((item->>'totalGross')::numeric) as total_revenue,
        o.currency
      FROM orders o,
        jsonb_array_elements(o.items) as item
      WHERE o.ordered_at >= (CURRENT_DATE AT TIME ZONE 'Europe/Warsaw') - INTERVAL '30 days'
        AND (item->>'isShipping')::boolean = false
      GROUP BY item->>'name', item->>'sku', item->>'image', o.currency
      ORDER BY total_quantity DESC
      LIMIT 500
    `;

    // Aggregate top products by name/sku and convert revenue to PLN
    const productMap = {};
    topProducts.rows.forEach(p => {
      const key = p.sku || p.name;
      if (!productMap[key]) {
        productMap[key] = {
          name: p.name,
          sku: p.sku,
          image: p.image,
          quantity: 0,
          revenue: 0
        };
      }
      productMap[key].quantity += parseInt(p.total_quantity);
      productMap[key].revenue += convertToPln(p.total_revenue, p.currency);
      // Keep first non-null image
      if (!productMap[key].image && p.image) {
        productMap[key].image = p.image;
      }
    });

    // Sort by quantity and take top 100
    const topProductsList = Object.values(productMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 100)
      .map(p => ({
        ...p,
        revenue: Math.round(p.revenue)
      }));

    // Build daily revenue chart data
    const dailyRevenueMap = {};
    revenueLast30Days.rows.forEach(r => {
      const dateStr = new Date(r.date).toISOString().split('T')[0];
      if (!dailyRevenueMap[dateStr]) {
        dailyRevenueMap[dateStr] = 0;
      }
      dailyRevenueMap[dateStr] += convertToPln(r.total, r.currency);
    });

    // Create array for last 30 days
    const last30DaysRevenue = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayLabel = date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' });
      last30DaysRevenue.push({
        date: dateStr,
        day: dayLabel,
        revenue: Math.round(dailyRevenueMap[dateStr] || 0)
      });
    }

    // Build daily orders map
    const dailyOrdersMap = {};
    ordersLast14Days.rows.forEach(r => {
      const dateStr = new Date(r.date).toISOString().split('T')[0];
      dailyOrdersMap[dateStr] = parseInt(r.count);
    });

    // Create array for last 14 days orders
    const last14DaysOrders = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayLabel = date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' });
      last14DaysOrders.push({
        date: dateStr,
        day: dayLabel,
        orders: dailyOrdersMap[dateStr] || 0
      });
    }

    return NextResponse.json({
      todayByPlatform: todayByPlatform.rows.map(r => ({
        platform: r.platform || 'Inne',
        count: parseInt(r.count)
      })),
      last30DaysByPlatform: last30DaysByPlatform.rows.map(r => ({
        platform: r.platform || 'Inne',
        count: parseInt(r.count)
      })),
      summary: {
        ordersToday: parseInt(ordersToday.rows[0].count),
        ordersYesterday: parseInt(ordersYesterday.rows[0].count),
        shippedToday: parseInt(shippedToday.rows[0].count),
        shippedYesterday: parseInt(shippedYesterday.rows[0].count),
        totalOrders: parseInt(totalOrders.rows[0].count)
      },
      revenue: {
        todayPln: Math.round(revenueTodayPln),
        last30DaysPln: Math.round(revenue30DaysPln),
        last30Days: last30DaysRevenue
      },
      dailyOrders: last14DaysOrders,
      topProducts: topProductsList
    });
  } catch (error) {
    console.error('[API] Error fetching stats:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
