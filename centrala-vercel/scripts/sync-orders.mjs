#!/usr/bin/env node
/**
 * Reczna synchronizacja zamowien z Apilo
 * Uzycie: node scripts/sync-orders.mjs [--historical DAYS]
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const args = process.argv.slice(2);
const isHistorical = args.includes('--historical');
const daysIndex = args.indexOf('--historical');
const days = daysIndex !== -1 && args[daysIndex + 1] ? parseInt(args[daysIndex + 1]) : 30;

async function syncOrders() {
  console.log('=== Synchronizacja zamowien z Apilo ===\n');

  // Dynamiczny import po zaladowaniu zmiennych srodowiskowych
  const { fetchAllNewOrders, fetchOrdersFromDateRange } = await import('../lib/apilo.js');
  const { saveOrders, getLastSyncDate } = await import('../lib/db.js');

  try {
    let orders;

    if (isHistorical) {
      console.log(`Tryb: Synchronizacja historyczna (${days} dni)`);
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);
      console.log('Od daty:', fromDate.toISOString());

      orders = await fetchOrdersFromDateRange(fromDate);
    } else {
      console.log('Tryb: Synchronizacja nowych zamowien');
      const lastSync = await getLastSyncDate();
      console.log('Ostatnia synchronizacja:', lastSync || 'nigdy');

      orders = await fetchAllNewOrders(lastSync);
    }

    console.log('\nPobrano zamowien:', orders.length);

    if (orders.length > 0) {
      console.log('Zapisywanie do bazy danych...');
      await saveOrders(orders);
      console.log('Zapisano pomyslnie!');

      // Podsumowanie
      const platforms = [...new Set(orders.map(o => o.channel.platform))];
      console.log('\nPlatformy:', platforms.join(', '));

      const totalRevenue = orders.reduce((sum, o) => {
        const amount = o.financials.totalGross;
        return sum + (o.financials.currency === 'EUR' ? amount * 4.35 : amount);
      }, 0);
      console.log('Laczny przychod (PLN):', totalRevenue.toFixed(2));
    }

    console.log('\n=== Synchronizacja zakonczona ===');

  } catch (error) {
    console.error('\nBLAD:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

syncOrders();
