import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { initDatabase } from '@/lib/db';

export async function GET(request) {
  try {
    await initDatabase();

    const { searchParams } = new URL(request.url);

    // Data source: 'orders' (last X days) or 'historical' (previous year data)
    const dataSource = searchParams.get('dataSource') || 'historical';

    // For 'orders' mode - number of days to analyze
    const days = parseInt(searchParams.get('days')) || 14;

    // For 'historical' mode - base month and year
    const baseMonth = parseInt(searchParams.get('baseMonth')) || new Date().getMonth() + 1;
    const baseYear = parseInt(searchParams.get('baseYear')) || new Date().getFullYear() - 1;

    // Planning parameters
    const planningDays = parseInt(searchParams.get('planningDays')) || 7;
    const safetyFactor = parseFloat(searchParams.get('safetyFactor')) || 1.0;

    // Normalizuj SKU
    const normalizeSku = (sku) => (sku || '').toUpperCase().trim().replace(/\s+/g, '-');

    // Fetch per-SKU configurations
    const skuConfigs = await sql`SELECT * FROM mts_sku_config`;
    const configMap = {};
    skuConfigs.rows.forEach(c => {
      configMap[normalizeSku(c.sku)] = {
        growthPercent: parseFloat(c.growth_percent) || 0,
        thresholdOk: parseInt(c.threshold_ok) || 100,
        thresholdWarning: parseInt(c.threshold_warning) || 200,
        thresholdCritical: parseInt(c.threshold_critical) || 300
      };
    });

    // Default thresholds
    const defaultConfig = {
      growthPercent: 0,
      thresholdOk: 100,
      thresholdWarning: 200,
      thresholdCritical: 300
    };

    let salesMap = {};
    let analyzedPeriod = '';

    if (dataSource === 'historical') {
      // Fetch from historical_sales table
      const historicalSales = await sql`
        SELECT sku, quantity
        FROM historical_sales
        WHERE year = ${baseYear} AND month = ${baseMonth}
      `;

      analyzedPeriod = `${baseMonth}/${baseYear} (dane historyczne)`;

      historicalSales.rows.forEach(row => {
        const key = normalizeSku(row.sku);
        salesMap[key] = {
          sku: row.sku,
          totalSold: parseInt(row.quantity) || 0
        };
      });
    } else {
      // Fetch from orders (current mode - last X days)
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

      analyzedPeriod = `ostatnie ${days} dni (aktualne zamowienia)`;

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
    }

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

    // Połącz dane i oblicz zapotrzebowanie
    const products = [];
    const allKeys = new Set([...Object.keys(inventoryMap), ...Object.keys(salesMap)]);

    // For historical mode, base period is 30 days (monthly data)
    const basePeriodDays = dataSource === 'historical' ? 30 : days;

    allKeys.forEach(key => {
      const inv = inventoryMap[key];
      const sales = salesMap[key];

      // Pomijaj produkty bez sprzedazy i bez stanu
      if (!sales && (!inv || inv.currentStock === 0)) return;

      const config = configMap[key] || defaultConfig;
      const growthMultiplier = 1 + (config.growthPercent / 100);

      const totalSold = sales?.totalSold || 0;
      const avgDaily = totalSold / basePeriodDays;

      // Apply growth percentage and safety factor
      const projectedDemand = avgDaily * planningDays * growthMultiplier * safetyFactor;
      const currentStock = inv?.currentStock || 0;
      const deficit = Math.round(projectedDemand - currentStock);
      const toProduce = deficit > 0 ? deficit : 0;

      // Determine priority based on per-SKU thresholds
      let priority = 'ok';
      if (deficit > config.thresholdCritical) {
        priority = 'critical';
      } else if (deficit > config.thresholdWarning) {
        priority = 'warning';
      } else if (deficit > config.thresholdOk) {
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
        projectedDemand: Math.round(projectedDemand),
        deficit,
        toProduce,
        priority,
        inInventory: !!inv,
        cena: inv?.cena || 0,
        growthPercent: config.growthPercent,
        thresholds: {
          ok: config.thresholdOk,
          warning: config.thresholdWarning,
          critical: config.thresholdCritical
        }
      });
    });

    // Sortuj po deficycie (najbardziej krytyczne na gorze)
    products.sort((a, b) => b.deficit - a.deficit);

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
        dataSource,
        analyzedPeriod,
        baseMonth: dataSource === 'historical' ? baseMonth : null,
        baseYear: dataSource === 'historical' ? baseYear : null,
        periodDays: dataSource === 'historical' ? 30 : days,
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
