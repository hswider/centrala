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

    // Calculate revenue in PLN
    let revenueTodayPln = 0;
    revenueToday.rows.forEach(r => {
      revenueTodayPln += convertToPln(r.total, r.currency);
    });

    let revenue30DaysPln = 0;
    revenue30Days.rows.forEach(r => {
      revenue30DaysPln += convertToPln(r.total, r.currency);
    });

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
      }
    });
  } catch (error) {
    console.error('[API] Error fetching stats:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
