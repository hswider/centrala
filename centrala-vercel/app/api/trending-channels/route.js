import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { initDatabase } from '../../../lib/db';

export async function GET(request) {
  try {
    await initDatabase();

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days')) || 7;

    // Get channels from current period (last X days)
    const currentPeriod = await sql`
      SELECT
        channel_platform as platform,
        channel_label as label,
        COUNT(*) as order_count,
        SUM(total_gross) as revenue,
        SUM((SELECT SUM((item->>'quantity')::int) FROM jsonb_array_elements(items) as item WHERE (item->>'isShipping')::boolean IS NOT TRUE)) as quantity
      FROM orders
      WHERE ordered_at >= (CURRENT_DATE - ${days}::int)
        AND ordered_at < CURRENT_DATE + 1
      GROUP BY channel_platform, channel_label
    `;

    // Get channels from previous period (X days before current period)
    const previousPeriod = await sql`
      SELECT
        channel_platform as platform,
        channel_label as label,
        COUNT(*) as order_count,
        SUM(total_gross) as revenue,
        SUM((SELECT SUM((item->>'quantity')::int) FROM jsonb_array_elements(items) as item WHERE (item->>'isShipping')::boolean IS NOT TRUE)) as quantity
      FROM orders
      WHERE ordered_at >= (CURRENT_DATE - ${days * 2}::int)
        AND ordered_at < (CURRENT_DATE - ${days}::int)
      GROUP BY channel_platform, channel_label
    `;

    // Create map of previous period data
    const previousMap = new Map();
    previousPeriod.rows.forEach(row => {
      const key = row.label || row.platform;
      previousMap.set(key, {
        orderCount: parseInt(row.order_count) || 0,
        revenue: parseFloat(row.revenue) || 0,
        quantity: parseInt(row.quantity) || 0
      });
    });

    // Calculate trend for each channel
    const channelsWithTrend = currentPeriod.rows.map(row => {
      const key = row.label || row.platform;
      const currentOrders = parseInt(row.order_count) || 0;
      const currentRevenue = parseFloat(row.revenue) || 0;
      const currentQuantity = parseInt(row.quantity) || 0;

      const previous = previousMap.get(key) || { orderCount: 0, revenue: 0, quantity: 0 };

      let orderTrend = 0;
      if (previous.orderCount > 0) {
        orderTrend = ((currentOrders - previous.orderCount) / previous.orderCount) * 100;
      } else if (currentOrders > 0) {
        orderTrend = 100;
      }

      let revenueTrend = 0;
      if (previous.revenue > 0) {
        revenueTrend = ((currentRevenue - previous.revenue) / previous.revenue) * 100;
      } else if (currentRevenue > 0) {
        revenueTrend = 100;
      }

      let quantityTrend = 0;
      if (previous.quantity > 0) {
        quantityTrend = ((currentQuantity - previous.quantity) / previous.quantity) * 100;
      } else if (currentQuantity > 0) {
        quantityTrend = 100;
      }

      return {
        platform: row.platform,
        label: row.label,
        currentOrders,
        previousOrders: previous.orderCount,
        currentRevenue: Math.round(currentRevenue * 100) / 100,
        previousRevenue: Math.round(previous.revenue * 100) / 100,
        currentQuantity,
        previousQuantity: previous.quantity,
        orderTrend: Math.round(orderTrend * 10) / 10,
        revenueTrend: Math.round(revenueTrend * 10) / 10,
        quantityTrend: Math.round(quantityTrend * 10) / 10
      };
    });

    // Also include channels that were in previous period but not in current
    previousPeriod.rows.forEach(row => {
      const key = row.label || row.platform;
      const existsInCurrent = channelsWithTrend.some(c => (c.label || c.platform) === key);

      if (!existsInCurrent) {
        const previous = {
          orderCount: parseInt(row.order_count) || 0,
          revenue: parseFloat(row.revenue) || 0,
          quantity: parseInt(row.quantity) || 0
        };
        channelsWithTrend.push({
          platform: row.platform,
          label: row.label,
          currentOrders: 0,
          previousOrders: previous.orderCount,
          currentRevenue: 0,
          previousRevenue: Math.round(previous.revenue * 100) / 100,
          currentQuantity: 0,
          previousQuantity: previous.quantity,
          orderTrend: -100,
          revenueTrend: -100,
          quantityTrend: -100
        });
      }
    });

    // Sort by order trend descending
    const sortedByTrend = [...channelsWithTrend].sort((a, b) => b.orderTrend - a.orderTrend);

    // TOP trending (highest positive growth)
    const topTrending = sortedByTrend
      .filter(c => c.currentOrders >= 1)
      .slice(0, 20);

    // Worst trending (highest negative growth)
    const worstTrending = sortedByTrend
      .filter(c => c.previousOrders >= 1)
      .slice(-20)
      .reverse();

    // Get daily data for sparklines
    const dailyData = await sql`
      SELECT
        DATE(ordered_at) as date,
        channel_label as label,
        channel_platform as platform,
        COUNT(*) as order_count,
        SUM(total_gross) as revenue
      FROM orders
      WHERE ordered_at >= (CURRENT_DATE - ${days}::int)
        AND ordered_at < CURRENT_DATE + 1
      GROUP BY DATE(ordered_at), channel_label, channel_platform
      ORDER BY date
    `;

    // Create sparkline data map
    const sparklineMap = new Map();
    dailyData.rows.forEach(row => {
      const key = row.label || row.platform;
      if (!sparklineMap.has(key)) {
        sparklineMap.set(key, []);
      }
      sparklineMap.get(key).push({
        date: row.date,
        orders: parseInt(row.order_count) || 0,
        revenue: parseFloat(row.revenue) || 0
      });
    });

    // Add sparkline data to channels
    const addSparkline = (channel) => ({
      ...channel,
      sparkline: sparklineMap.get(channel.label || channel.platform) || []
    });

    return NextResponse.json({
      success: true,
      period: days,
      topTrending: topTrending.map(addSparkline),
      worstTrending: worstTrending.map(addSparkline)
    });
  } catch (error) {
    console.error('Trending channels error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
