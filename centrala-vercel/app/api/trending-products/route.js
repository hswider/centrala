import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { initDatabase } from '../../../lib/db';

export async function GET(request) {
  try {
    await initDatabase();

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days')) || 7;

    // Current period: last X days
    // Previous period: X days before that
    // Compare volume change

    // Get products from current period (last X days)
    const currentPeriod = await sql`
      SELECT
        item->>'name' as name,
        item->>'sku' as sku,
        item->>'image' as image,
        channel_platform as platform,
        SUM((item->>'quantity')::int) as quantity
      FROM orders, jsonb_array_elements(items) as item
      WHERE ordered_at >= (CURRENT_DATE - ${days}::int)
        AND ordered_at < CURRENT_DATE + 1
        AND (item->>'isShipping')::boolean IS NOT TRUE
        AND item->>'name' IS NOT NULL
        AND item->>'name' != ''
      GROUP BY item->>'name', item->>'sku', item->>'image', channel_platform
    `;

    // Get products from previous period (X days before current period)
    const previousPeriod = await sql`
      SELECT
        item->>'name' as name,
        item->>'sku' as sku,
        item->>'image' as image,
        channel_platform as platform,
        SUM((item->>'quantity')::int) as quantity
      FROM orders, jsonb_array_elements(items) as item
      WHERE ordered_at >= (CURRENT_DATE - ${days * 2}::int)
        AND ordered_at < (CURRENT_DATE - ${days}::int)
        AND (item->>'isShipping')::boolean IS NOT TRUE
        AND item->>'name' IS NOT NULL
        AND item->>'name' != ''
      GROUP BY item->>'name', item->>'sku', item->>'image', channel_platform
    `;

    // Create map of previous period quantities
    const previousMap = new Map();
    previousPeriod.rows.forEach(row => {
      const key = row.sku || row.name;
      previousMap.set(key, parseInt(row.quantity) || 0);
    });

    // Calculate trend for each product
    const productsWithTrend = currentPeriod.rows.map(row => {
      const key = row.sku || row.name;
      const currentQty = parseInt(row.quantity) || 0;
      const previousQty = previousMap.get(key) || 0;

      let trendPercent = 0;
      if (previousQty > 0) {
        trendPercent = ((currentQty - previousQty) / previousQty) * 100;
      } else if (currentQty > 0) {
        trendPercent = 100; // New product, 100% growth
      }

      return {
        name: row.name,
        sku: row.sku,
        image: row.image,
        platform: row.platform,
        currentQuantity: currentQty,
        previousQuantity: previousQty,
        change: currentQty - previousQty,
        trendPercent: Math.round(trendPercent * 10) / 10
      };
    });

    // Also include products that were in previous period but not in current (declining to 0)
    previousPeriod.rows.forEach(row => {
      const key = row.sku || row.name;
      const existsInCurrent = productsWithTrend.some(p => (p.sku || p.name) === key);

      if (!existsInCurrent) {
        const previousQty = parseInt(row.quantity) || 0;
        productsWithTrend.push({
          name: row.name,
          sku: row.sku,
          image: row.image,
          platform: row.platform,
          currentQuantity: 0,
          previousQuantity: previousQty,
          change: -previousQty,
          trendPercent: -100
        });
      }
    });

    // Sort by trend percent descending for top trending
    const sortedByTrend = [...productsWithTrend].sort((a, b) => b.trendPercent - a.trendPercent);

    // TOP 10 trending (highest positive growth)
    const topTrending = sortedByTrend
      .filter(p => p.currentQuantity >= 3) // Minimum 3 units to be significant
      .slice(0, 10);

    // TOP 10 worst trending (highest negative growth)
    const worstTrending = sortedByTrend
      .filter(p => p.previousQuantity >= 3) // Had at least 3 units before
      .slice(-10)
      .reverse();

    // Get daily data for sparklines (last X days for top products)
    const topSkus = topTrending.map(p => p.sku || p.name);
    const worstSkus = worstTrending.map(p => p.sku || p.name);
    const allSkus = [...new Set([...topSkus, ...worstSkus])];

    // Get daily breakdown for sparklines
    const dailyData = await sql`
      SELECT
        DATE(ordered_at) as date,
        item->>'name' as name,
        item->>'sku' as sku,
        SUM((item->>'quantity')::int) as quantity
      FROM orders, jsonb_array_elements(items) as item
      WHERE ordered_at >= (CURRENT_DATE - ${days}::int)
        AND ordered_at < CURRENT_DATE + 1
        AND (item->>'isShipping')::boolean IS NOT TRUE
      GROUP BY DATE(ordered_at), item->>'name', item->>'sku'
      ORDER BY date
    `;

    // Create sparkline data map
    const sparklineMap = new Map();
    dailyData.rows.forEach(row => {
      const key = row.sku || row.name;
      if (!sparklineMap.has(key)) {
        sparklineMap.set(key, []);
      }
      sparklineMap.get(key).push({
        date: row.date,
        quantity: parseInt(row.quantity) || 0
      });
    });

    // Add sparkline data to products
    const addSparkline = (product) => ({
      ...product,
      sparkline: sparklineMap.get(product.sku || product.name) || []
    });

    return NextResponse.json({
      success: true,
      period: days,
      topTrending: topTrending.map(addSparkline),
      worstTrending: worstTrending.map(addSparkline)
    });
  } catch (error) {
    console.error('Trending products error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
