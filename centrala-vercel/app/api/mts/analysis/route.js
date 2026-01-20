import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { initDatabase } from '@/lib/db';

export async function GET(request) {
  try {
    await initDatabase();

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days')) || 14;
    const planningDays = parseInt(searchParams.get('planningDays')) || 7;
    const safetyFactor = parseFloat(searchParams.get('safetyFactor')) || 1.2;

    // Pobierz trendy sprzedazy z ostatnich X dni
    const salesTrends = await sql`
      SELECT
        item->>'sku' as sku,
        item->>'name' as nazwa,
        SUM((item->>'quantity')::int) as total_sold,
        COUNT(DISTINCT o.id) as order_count
      FROM orders o, jsonb_array_elements(items) as item
      WHERE ordered_at >= (CURRENT_DATE AT TIME ZONE 'Europe/Warsaw') - INTERVAL '1 day' * ${days}
        AND is_canceled = false
        AND (item->>'isShipping')::boolean = false
      GROUP BY item->>'sku', item->>'name'
    `;

    // Pobierz stany inventory (gotowe produkty)
    const inventoryStock = await sql`
      SELECT
        id,
        sku,
        nazwa,
        stan,
        min_stock,
        lead_time_days,
        cena
      FROM inventory
      WHERE kategoria = 'gotowe'
    `;

    // Normalizuj SKU
    const normalizeSku = (sku) => (sku || '').toUpperCase().trim().replace(/\s+/g, '-');

    // Buduj mapę inventory
    const inventoryMap = {};
    inventoryStock.rows.forEach(item => {
      const key = normalizeSku(item.sku);
      inventoryMap[key] = {
        id: item.id,
        sku: item.sku,
        nazwa: item.nazwa,
        currentStock: parseFloat(item.stan) || 0,
        minStock: parseInt(item.min_stock) || 0,
        leadTimeDays: parseInt(item.lead_time_days) || 1,
        cena: parseFloat(item.cena) || 0
      };
    });

    // Buduj mapę sprzedazy
    const salesMap = {};
    salesTrends.rows.forEach(row => {
      const key = normalizeSku(row.sku);
      if (!salesMap[key]) {
        salesMap[key] = {
          sku: row.sku,
          nazwa: row.nazwa,
          totalSold: 0,
          orderCount: 0
        };
      }
      salesMap[key].totalSold += parseInt(row.total_sold) || 0;
      salesMap[key].orderCount += parseInt(row.order_count) || 0;
    });

    // Polacz dane i oblicz zapotrzebowanie
    const products = [];
    const allKeys = new Set([...Object.keys(inventoryMap), ...Object.keys(salesMap)]);

    allKeys.forEach(key => {
      const inv = inventoryMap[key];
      const sales = salesMap[key];

      // Pomijaj produkty bez sprzedazy i bez stanu
      if (!sales && (!inv || inv.currentStock === 0)) return;

      const totalSold = sales?.totalSold || 0;
      const avgDaily = totalSold / days;
      const weeklyDemand = avgDaily * planningDays;
      const currentStock = inv?.currentStock || 0;
      const deficit = currentStock - (weeklyDemand * safetyFactor);
      const toProduce = deficit < 0 ? Math.ceil(Math.abs(deficit)) : 0;

      // Okresl priorytet
      let priority = 'ok';
      if (deficit < -weeklyDemand * 0.5) {
        priority = 'critical';
      } else if (deficit < 0) {
        priority = 'warning';
      }

      products.push({
        id: inv?.id || null,
        sku: inv?.sku || sales?.sku || key,
        nazwa: inv?.nazwa || sales?.nazwa || key,
        currentStock: Math.round(currentStock * 100) / 100,
        minStock: inv?.minStock || 0,
        totalSold,
        avgDaily: Math.round(avgDaily * 100) / 100,
        weeklyDemand: Math.round(weeklyDemand),
        deficit: Math.round(deficit),
        toProduce,
        priority,
        inInventory: !!inv,
        cena: inv?.cena || 0
      });
    });

    // Sortuj po deficycie (najbardziej krytyczne na gorze)
    products.sort((a, b) => a.deficit - b.deficit);

    // Statystyki podsumowujace
    const summary = {
      totalProducts: products.length,
      criticalCount: products.filter(p => p.priority === 'critical').length,
      warningCount: products.filter(p => p.priority === 'warning').length,
      okCount: products.filter(p => p.priority === 'ok').length,
      totalToProduce: products.reduce((sum, p) => sum + p.toProduce, 0),
      notInInventory: products.filter(p => !p.inInventory).length
    };

    return NextResponse.json({
      success: true,
      analysis: {
        periodDays: days,
        planningDays,
        safetyFactor,
        generatedAt: new Date().toISOString(),
        summary,
        products
      }
    });
  } catch (error) {
    console.error('[API] MTS Analysis error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
