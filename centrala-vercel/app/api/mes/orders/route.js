import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { initDatabase } from '@/lib/db';

const OMS_STATUS_MAP = {
  4: 'Niepotwierdzone', 1: 'Nowy', 7: 'W realizacji', 10: 'Do wysłania',
  13: 'Wysłane', 19: 'Anulowane', 16: 'Zduplikowane',
  22: 'PALETY-NOWE', 113: 'PALETY-W REALIZACJI', 166: 'PILNE - PALETY', 169: 'BARDZO PILNE - PALETY',
  25: 'PIKÓWKI-NOWE', 116: 'PIKÓWKI-W REALIZACJI', 103: 'PILNE - PIKÓWKI', 106: 'BARDZO PILNE - PIKÓWKI',
  28: 'ŁAWKI-NOWE', 119: 'ŁAWKI-W REALIZACJI', 172: 'PILNE - ŁAWKI', 175: 'BARDZO PILNE - ŁAWKI',
  199: 'ŁAWKI SIEDZISKA-NOWE', 205: 'ŁAWKI SIEDZISKA-W REALIZACJI', 178: 'PILNE - ŁAWKI SIEDZISKA', 181: 'BARDZO PILNE - ŁAWKI SIEDZISKA',
  31: 'POOM KIDS-NOWE', 122: 'POOM KIDS-W REALIZACJI', 228: 'PILNE - POOM KIDS', 225: 'BARDZO PILNE - POOM KIDS',
  46: 'LEGOWISKA-NOWE', 131: 'LEGOWISKA-W REALIZACJI', 184: 'PILNE - LEGOWISKA', 187: 'BARDZO PILNE - LEGOWISKA',
  57: 'SARIS GARAGE-NOWE', 125: 'SARIS GARAGE-W REALIZACJI', 220: 'SARIS GARAGE BARDZO PILNE',
  209: 'SARIS GARAGE NIESTANDARDY - Nowe', 212: 'SARIS GARAGE NIESTANDARDY - W REALIZACJI',
  82: 'MEBLE OGRODOWE-NOWE', 128: 'MEBLE OGRODOWE-W REALIZACJI',
  134: 'INDYWIDUALNE-NOWE', 137: 'INDYWIDUALNE-W REALIZACJI',
  155: 'HOUSE NOWE', 158: 'HOUSE PRODUKCJA', 161: 'HOUSE WYPRODUKOWANE',
  85: 'MEBLE DOSYŁKA', 110: 'Dosyłka', 60: 'ETYKIETY DO ZR',
  97: 'ZAM DO WYJAŚ', 100: 'WYJAŚNIONE', 214: 'UPS DO WYJASNIENIA', 217: 'UPS WYJASNIONE', 233: 'DO WYJASNIENIA KAROLA',
  63: 'ODSTĄPIENIE OD UMOWY', 81: 'BEZ ODBIORU', 223: 'ZWROT NIEMCY', 69: 'BARCZEWO WRÓCIŁO', 78: 'ZWRÓCONE ŚRODKI', 231: 'WRÓCIŁO POLSKA',
  188: 'AMAZON W BLu',
};

export async function GET(request) {
  try {
    await initDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit')) || 500;
    const includeAll = status === 'all';

    // Dynamic date range (default: last 30 days)
    const dateFrom = searchParams.get('dateFrom') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dateTo = searchParams.get('dateTo') || null;

    console.log('[MES API] Request params:', { status, limit, includeAll, dateFrom, dateTo });

    const orders = includeAll
      ? (dateTo
        ? await sql`
            SELECT
              id, external_id, channel_label, channel_platform,
              ordered_at, items, customer, shipping,
              total_gross, currency, delivery_status, payment_status, is_canceled
            FROM orders
            WHERE ordered_at >= ${dateFrom} AND ordered_at < ${dateTo + 'T23:59:59'}
            ORDER BY ordered_at DESC
            LIMIT ${limit}
          `
        : await sql`
            SELECT
              id, external_id, channel_label, channel_platform,
              ordered_at, items, customer, shipping,
              total_gross, currency, delivery_status, payment_status, is_canceled
            FROM orders
            WHERE ordered_at >= ${dateFrom}
            ORDER BY ordered_at DESC
            LIMIT ${limit}
          `)
      : (dateTo
        ? await sql`
            SELECT
              id, external_id, channel_label, channel_platform,
              ordered_at, items, customer, shipping,
              total_gross, currency, delivery_status, payment_status, is_canceled
            FROM orders
            WHERE ordered_at >= ${dateFrom} AND ordered_at < ${dateTo + 'T23:59:59'}
            ORDER BY ordered_at DESC
            LIMIT ${limit}
          `
        : await sql`
            SELECT
              id, external_id, channel_label, channel_platform,
              ordered_at, items, customer, shipping,
              total_gross, currency, delivery_status, payment_status, is_canceled
            FROM orders
            WHERE ordered_at >= ${dateFrom}
            ORDER BY ordered_at DESC
            LIMIT ${limit}
          `);

    console.log('[MES API] Orders from DB:', orders.rows.length);

    // Pobierz produkty z inventory ze stanem > 0
    const inventory = await sql`
      SELECT id, sku, nazwa, stan, kategoria, cena
      FROM inventory
      WHERE stan > 0
    `;

    // Pobierz WSZYSTKIE gotowe produkty (nawet stan=0) do lookup receptur
    const gotoweAll = await sql`
      SELECT id, sku FROM inventory WHERE kategoria = 'gotowe'
    `;

    const inventoryMap = {
      gotowe: {},
      polprodukty: {},
      wykroje: {},
      surowce: {}
    };

    inventory.rows.forEach(item => {
      const key = (item.sku || '').toUpperCase().trim();
      if (inventoryMap[item.kategoria]) {
        inventoryMap[item.kategoria][key] = {
          id: item.id,
          sku: item.sku,
          nazwa: item.nazwa,
          stan: parseFloat(item.stan) || 0,
          cena: parseFloat(item.cena) || 0
        };
      }
    });

    // Mapa gotowe po SKU do lookup receptur (wlacznie ze stanem 0)
    const gotoweRecipeLookup = {};
    gotoweAll.rows.forEach(item => {
      const key = (item.sku || '').toUpperCase().trim();
      gotoweRecipeLookup[key] = { id: item.id };
    });

    // Pobierz receptury
    const recipes = await sql`
      SELECT
        r.product_id, r.ingredient_id, r.quantity,
        i.sku as ingredient_sku, i.nazwa as ingredient_nazwa,
        i.kategoria as ingredient_kategoria, i.stan as ingredient_stan
      FROM recipes r
      JOIN inventory i ON r.ingredient_id = i.id
    `;

    const recipeMap = {};
    recipes.rows.forEach(r => {
      if (!recipeMap[r.product_id]) {
        recipeMap[r.product_id] = [];
      }
      recipeMap[r.product_id].push({
        ingredientId: r.ingredient_id,
        sku: r.ingredient_sku,
        nazwa: r.ingredient_nazwa,
        kategoria: r.ingredient_kategoria,
        quantity: parseFloat(r.quantity) || 1,
        stan: parseFloat(r.ingredient_stan) || 0
      });
    });

    // Przetworz zamowienia
    const processedOrders = orders.rows.map(order => {
      const items = order.items || [];

      const processedItems = items
        .filter(item => !item.isShipping)
        .map(item => {
          const sku = (item.sku || '').toUpperCase().trim();
          const quantity = parseInt(item.quantity) || 1;

          const availability = {
            gotowe: inventoryMap.gotowe[sku] || null,
            polprodukty: null,
            wykroje: null,
            surowce: null
          };

          const nameLower = (item.name || '').toLowerCase();

          Object.keys(inventoryMap.polprodukty).forEach(key => {
            const inv = inventoryMap.polprodukty[key];
            if (key.includes(sku) || inv.nazwa.toLowerCase().includes(nameLower.slice(0, 20))) {
              if (!availability.polprodukty || inv.stan > availability.polprodukty.stan) {
                availability.polprodukty = inv;
              }
            }
          });

          Object.keys(inventoryMap.wykroje).forEach(key => {
            const inv = inventoryMap.wykroje[key];
            if (key.includes(sku) || inv.nazwa.toLowerCase().includes(nameLower.slice(0, 20))) {
              if (!availability.wykroje || inv.stan > availability.wykroje.stan) {
                availability.wykroje = inv;
              }
            }
          });

          // Status produkcji
          let productionStatus = 'needs_production';
          let availableFrom = null;
          let missingQty = quantity;

          if (availability.gotowe && availability.gotowe.stan >= quantity) {
            productionStatus = 'ready';
            availableFrom = 'gotowe';
            missingQty = 0;
          } else if (availability.gotowe && availability.gotowe.stan > 0) {
            productionStatus = 'partial';
            availableFrom = 'gotowe';
            missingQty = quantity - availability.gotowe.stan;
          } else if (availability.polprodukty && availability.polprodukty.stan >= quantity) {
            productionStatus = 'from_polprodukty';
            availableFrom = 'polprodukty';
          } else if (availability.wykroje && availability.wykroje.stan >= quantity) {
            productionStatus = 'from_wykroje';
            availableFrom = 'wykroje';
          } else {
            productionStatus = 'from_surowce';
            availableFrom = 'surowce';
          }

          // Receptura - szukaj w gotowe (takze ze stanem 0)
          let recipe = null;
          const gotoweEntry = availability.gotowe || gotoweRecipeLookup[sku];
          if (gotoweEntry) {
            recipe = recipeMap[gotoweEntry.id] || null;
          }

          // Alerty
          const alerts = [];
          if (!sku || sku === '') {
            alerts.push({ type: 'error', message: 'Brak SKU' });
          }
          if (sku && productionStatus !== 'ready' && !recipe) {
            alerts.push({ type: 'warning', message: 'Brak receptury' });
          }

          return {
            name: item.name,
            sku: item.sku,
            quantity,
            image: item.image,
            priceGross: item.priceGross,
            availability,
            productionStatus,
            availableFrom,
            missingQty,
            recipe,
            alerts
          };
        });

      // Status zamowienia
      const allReady = processedItems.every(i => i.productionStatus === 'ready');
      const anyNeedsProduction = processedItems.some(i =>
        ['needs_production', 'from_surowce', 'from_wykroje', 'from_polprodukty'].includes(i.productionStatus)
      );

      const isShipped = order.delivery_status === 13;
      const isCanceled = order.is_canceled === true || order.delivery_status === 19 || order.delivery_status === 16;
      const isPaid = order.payment_status === 'PAID';

      let orderStatus = 'ready_to_ship';
      if (isCanceled) {
        orderStatus = 'canceled';
      } else if (isShipped) {
        orderStatus = 'shipped';
      } else if (!isPaid) {
        orderStatus = 'unpaid';
      } else if (anyNeedsProduction) {
        orderStatus = 'needs_production';
      } else if (!allReady) {
        orderStatus = 'partial';
      }

      // Przypisanie dzialu produkcyjnego
      let department = null;
      if (!isCanceled && !isShipped && isPaid) {
        if (processedItems.length > 1) {
          department = 'wielopak';
        } else {
          // Ustal dzial na podstawie najgorszego statusu
          let worstDept = 'gotowe';
          for (const item of processedItems) {
            // Brak SKU -> krojownia
            if (!item.sku || item.sku.trim() === '') {
              worstDept = 'krojownia';
              break;
            }
            // Brak receptury (nie gotowe) -> krojownia
            if (item.productionStatus !== 'ready' && !item.recipe) {
              worstDept = 'krojownia';
              break;
            }
            // Z surowcow / do produkcji -> krojownia
            if (['from_surowce', 'needs_production'].includes(item.productionStatus)) {
              worstDept = 'krojownia';
              break;
            }
            // Z wykrojow -> szwalnia
            if (item.productionStatus === 'from_wykroje') {
              if (worstDept !== 'krojownia') worstDept = 'szwalnia';
            }
            // Z polproduktow lub czesciowo -> polprodukty
            if (item.productionStatus === 'from_polprodukty' || item.productionStatus === 'partial') {
              if (!['krojownia', 'szwalnia'].includes(worstDept)) worstDept = 'polprodukty';
            }
          }
          department = worstDept;
        }
      }

      return {
        id: order.id,
        externalId: order.external_id,
        channelLabel: order.channel_label,
        channelPlatform: order.channel_platform,
        orderedAt: order.ordered_at,
        customer: order.customer,
        shipping: order.shipping,
        totalGross: order.total_gross,
        currency: order.currency,
        deliveryStatus: order.delivery_status,
        omsStatus: OMS_STATUS_MAP[order.delivery_status] || (order.delivery_status != null ? `#${order.delivery_status}` : null),
        paymentStatus: order.payment_status,
        isCanceled,
        isPaid,
        items: processedItems,
        orderStatus,
        isShipped,
        department,
        itemsCount: processedItems.length,
        readyCount: processedItems.filter(i => i.productionStatus === 'ready').length,
        needsProductionCount: processedItems.filter(i => i.productionStatus !== 'ready').length
      };
    });

    // Filtruj po statusie
    let filteredOrders = processedOrders;
    if (status === 'pending') {
      filteredOrders = processedOrders.filter(o => !['ready_to_ship', 'shipped', 'canceled', 'unpaid'].includes(o.orderStatus));
    } else if (status === 'ready') {
      filteredOrders = processedOrders.filter(o => o.orderStatus === 'ready_to_ship');
    } else if (status === 'shipped') {
      filteredOrders = processedOrders.filter(o => o.orderStatus === 'shipped');
    } else if (status === 'canceled') {
      filteredOrders = processedOrders.filter(o => o.orderStatus === 'canceled');
    } else if (status === 'unpaid') {
      filteredOrders = processedOrders.filter(o => o.orderStatus === 'unpaid');
    }

    // Statystyki
    const activeOrders = processedOrders.filter(o => o.department !== null);
    const stats = {
      total: processedOrders.length,
      readyToShip: processedOrders.filter(o => o.orderStatus === 'ready_to_ship').length,
      needsProduction: processedOrders.filter(o => o.orderStatus === 'needs_production').length,
      partial: processedOrders.filter(o => o.orderStatus === 'partial').length,
      shipped: processedOrders.filter(o => o.orderStatus === 'shipped').length,
      canceled: processedOrders.filter(o => o.orderStatus === 'canceled').length,
      unpaid: processedOrders.filter(o => o.orderStatus === 'unpaid').length,
      departments: {
        wszystkie: activeOrders.length,
        krojownia: activeOrders.filter(o => o.department === 'krojownia').length,
        szwalnia: activeOrders.filter(o => o.department === 'szwalnia').length,
        polprodukty: activeOrders.filter(o => o.department === 'polprodukty').length,
        gotowe: activeOrders.filter(o => o.department === 'gotowe').length,
        wielopak: activeOrders.filter(o => o.department === 'wielopak').length,
      }
    };

    return NextResponse.json({
      success: true,
      stats,
      orders: filteredOrders
    });
  } catch (error) {
    console.error('[API] MES Orders error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
