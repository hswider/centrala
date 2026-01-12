#!/usr/bin/env node
/**
 * Wykonaj dowolne zapytanie SQL na bazie Vercel Postgres
 * Uzycie: node scripts/db-query.mjs "SELECT * FROM orders LIMIT 5"
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const query = process.argv[2];

if (!query) {
  console.log('Uzycie: node scripts/db-query.mjs "ZAPYTANIE SQL"');
  console.log('\nPrzyklady:');
  console.log('  node scripts/db-query.mjs "SELECT COUNT(*) FROM orders"');
  console.log('  node scripts/db-query.mjs "SELECT * FROM orders ORDER BY ordered_at DESC LIMIT 5"');
  console.log('  node scripts/db-query.mjs "SELECT channel_platform, COUNT(*) FROM orders GROUP BY channel_platform"');
  process.exit(0);
}

async function runQuery() {
  const { sql } = await import('@vercel/postgres');

  try {
    console.log('Zapytanie:', query);
    console.log('---');

    // UWAGA: To jest niebezpieczne dla niezaufanych danych!
    // Uzywaj tylko lokalnie do debugowania
    const result = await sql.query(query);

    if (result.rows.length === 0) {
      console.log('Brak wynikow');
    } else {
      console.table(result.rows);
      console.log(`\nZwrocono ${result.rows.length} rekordow`);
    }

  } catch (error) {
    console.error('BLAD SQL:', error.message);
    process.exit(1);
  }
}

runQuery();
