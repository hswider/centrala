#!/usr/bin/env node
/**
 * Test polaczenia z baza danych Vercel Postgres
 * Uzycie: node scripts/test-db.mjs
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

async function testConnection() {
  console.log('=== Test polaczenia z Vercel Postgres ===\n');

  // Dynamiczny import po zaladowaniu zmiennych srodowiskowych
  const { sql } = await import('@vercel/postgres');

  try {
    // Test podstawowego polaczenia
    console.log('1. Testowanie polaczenia...');
    const result = await sql`SELECT NOW() as current_time, current_database() as db_name`;
    console.log('   OK - Polaczono z baza:', result.rows[0].db_name);
    console.log('   Czas serwera:', result.rows[0].current_time);

    // Test tabeli orders
    console.log('\n2. Sprawdzanie tabeli orders...');
    const ordersCount = await sql`SELECT COUNT(*) as count FROM orders`;
    console.log('   OK - Liczba zamowien:', ordersCount.rows[0].count);

    // Test tabeli tokens
    console.log('\n3. Sprawdzanie tabeli tokens...');
    const tokensCount = await sql`SELECT COUNT(*) as count FROM tokens`;
    console.log('   OK - Liczba rekordow tokens:', tokensCount.rows[0].count);

    // Statystyki zamowien
    console.log('\n4. Statystyki zamowien (ostatnie 7 dni)...');
    const stats = await sql`
      SELECT
        COUNT(*) as order_count,
        COALESCE(SUM(total_gross), 0) as total_revenue,
        COUNT(DISTINCT channel_platform) as platforms
      FROM orders
      WHERE ordered_at >= CURRENT_DATE - INTERVAL '7 days'
        AND is_canceled = false
    `;
    console.log('   Zamowienia:', stats.rows[0].order_count);
    console.log('   Przychod:', stats.rows[0].total_revenue);
    console.log('   Platformy:', stats.rows[0].platforms);

    // Ostatnie zamowienie
    console.log('\n5. Ostatnie zamowienie...');
    const lastOrder = await sql`
      SELECT id, channel_platform, total_gross, currency, ordered_at
      FROM orders
      ORDER BY ordered_at DESC
      LIMIT 1
    `;
    if (lastOrder.rows.length > 0) {
      const order = lastOrder.rows[0];
      console.log('   ID:', order.id);
      console.log('   Platforma:', order.channel_platform);
      console.log('   Wartosc:', order.total_gross, order.currency);
      console.log('   Data:', order.ordered_at);
    } else {
      console.log('   Brak zamowien w bazie');
    }

    console.log('\n=== Wszystkie testy zakonczone pomyslnie! ===');

  } catch (error) {
    console.error('\nBLAD:', error.message);
    if (error.message.includes('POSTGRES_URL')) {
      console.error('\nSprawdz czy plik .env.local zawiera poprawne zmienne POSTGRES_*');
      console.error('Uzyj: vercel env pull .env.local');
    }
    process.exit(1);
  }
}

testConnection();
