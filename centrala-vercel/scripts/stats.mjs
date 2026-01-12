#!/usr/bin/env node
/**
 * Wyswietl statystyki sprzedazy
 * Uzycie: node scripts/stats.mjs
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

async function showStats() {
  console.log('=== Statystyki Centrala POOM ===\n');

  const {
    getTodayStats,
    getYesterdayStats,
    getLast7DaysStats,
    getLast30DaysStats,
    getThisMonthStats,
    getStatsByPlatformLast7Days,
    getTopProductsLast30Days,
    getOverallStats
  } = await import('../lib/db.js');

  try {
    // Dzisiaj
    const today = await getTodayStats();
    console.log('DZISIAJ:');
    console.log(`  Zamowienia: ${today.order_count}`);
    console.log(`  Przychod: ${today.total_revenue_pln.toFixed(2)} PLN`);
    console.log(`  Srednia: ${today.avg_order_value_pln.toFixed(2)} PLN`);

    // Wczoraj
    const yesterday = await getYesterdayStats();
    console.log('\nWCZORAJ:');
    console.log(`  Zamowienia: ${yesterday.order_count}`);
    console.log(`  Przychod: ${yesterday.total_revenue_pln.toFixed(2)} PLN`);

    // Ostatnie 7 dni
    const last7 = await getLast7DaysStats();
    console.log('\nOSTATNIE 7 DNI:');
    console.log(`  Zamowienia: ${last7.order_count}`);
    console.log(`  Przychod: ${last7.total_revenue_pln.toFixed(2)} PLN`);
    console.log(`  Srednia: ${last7.avg_order_value_pln.toFixed(2)} PLN`);

    // Ostatnie 30 dni
    const last30 = await getLast30DaysStats();
    console.log('\nOSTATNIE 30 DNI:');
    console.log(`  Zamowienia: ${last30.order_count}`);
    console.log(`  Przychod: ${last30.total_revenue_pln.toFixed(2)} PLN`);

    // Ten miesiac
    const thisMonth = await getThisMonthStats();
    console.log('\nTEN MIESIAC:');
    console.log(`  Zamowienia: ${thisMonth.order_count}`);
    console.log(`  Przychod: ${thisMonth.total_revenue_pln.toFixed(2)} PLN`);

    // Platformy (7 dni)
    const platforms = await getStatsByPlatformLast7Days();
    console.log('\nPLATFORMY (7 dni):');
    platforms.forEach(p => {
      console.log(`  ${p.channel_platform}: ${p.order_count} zamowien, ${parseFloat(p.total_revenue).toFixed(2)}`);
    });

    // Top produkty
    const topProducts = await getTopProductsLast30Days(5);
    console.log('\nTOP 5 PRODUKTOW (30 dni):');
    topProducts.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.product_name} (${p.sku}) - ${p.total_quantity} szt.`);
    });

    // Ogolne
    const overall = await getOverallStats();
    console.log('\nOGOLNE:');
    console.log(`  Wszystkie zamowienia: ${overall.total_orders}`);
    console.log(`  Anulowane: ${overall.canceled_orders}`);
    console.log(`  Platformy: ${overall.platform_count}`);
    console.log(`  Pierwsze zamowienie: ${overall.first_order_date}`);
    console.log(`  Ostatnie zamowienie: ${overall.last_order_date}`);

    console.log('\n=== Koniec raportu ===');

  } catch (error) {
    console.error('BLAD:', error.message);
    process.exit(1);
  }
}

showStats();
