import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { initDatabase } from '@/lib/db';

const OMS_STATUS_MAP = {
  4:   { label: 'Niepotwierdzone', color: 'gray' },
  1:   { label: 'Nowy', color: 'blue' },
  7:   { label: 'W realizacji', color: 'yellow' },
  10:  { label: 'Do wysłania', color: 'purple' },
  13:  { label: 'Wysłane', color: 'green' },
  19:  { label: 'Anulowane', color: 'gray' },
  16:  { label: 'Zduplikowane', color: 'gray' },
  22:  { label: 'PALETY-NOWE', color: 'blue' },
  113: { label: 'PALETY-W REALIZACJI', color: 'yellow' },
  166: { label: 'PILNE - PALETY', color: 'orange' },
  169: { label: 'BARDZO PILNE - PALETY', color: 'red' },
  25:  { label: 'PIKÓWKI-NOWE', color: 'blue' },
  116: { label: 'PIKÓWKI-W REALIZACJI', color: 'yellow' },
  103: { label: 'PILNE - PIKÓWKI', color: 'orange' },
  106: { label: 'BARDZO PILNE - PIKÓWKI', color: 'red' },
  28:  { label: 'ŁAWKI-NOWE', color: 'blue' },
  119: { label: 'ŁAWKI-W REALIZACJI', color: 'yellow' },
  172: { label: 'PILNE - ŁAWKI', color: 'orange' },
  175: { label: 'BARDZO PILNE - ŁAWKI', color: 'red' },
  199: { label: 'ŁAWKI SIEDZISKA-NOWE', color: 'blue' },
  205: { label: 'ŁAWKI SIEDZISKA-W REALIZACJI', color: 'yellow' },
  178: { label: 'PILNE - ŁAWKI SIEDZISKA', color: 'orange' },
  181: { label: 'BARDZO PILNE - ŁAWKI SIEDZISKA', color: 'red' },
  31:  { label: 'POOM KIDS-NOWE', color: 'blue' },
  122: { label: 'POOM KIDS-W REALIZACJI', color: 'yellow' },
  228: { label: 'PILNE - POOM KIDS', color: 'orange' },
  225: { label: 'BARDZO PILNE - POOM KIDS', color: 'red' },
  46:  { label: 'LEGOWISKA-NOWE', color: 'blue' },
  131: { label: 'LEGOWISKA-W REALIZACJI', color: 'yellow' },
  184: { label: 'PILNE - LEGOWISKA', color: 'orange' },
  187: { label: 'BARDZO PILNE - LEGOWISKA', color: 'red' },
  57:  { label: 'SARIS GARAGE-NOWE', color: 'blue' },
  125: { label: 'SARIS GARAGE-W REALIZACJI', color: 'yellow' },
  220: { label: 'SARIS GARAGE BARDZO PILNE', color: 'red' },
  209: { label: 'SARIS GARAGE NIESTANDARDY - Nowe', color: 'blue' },
  212: { label: 'SARIS GARAGE NIESTANDARDY - W REALIZACJI', color: 'yellow' },
  82:  { label: 'MEBLE OGRODOWE-NOWE', color: 'blue' },
  128: { label: 'MEBLE OGRODOWE-W REALIZACJI', color: 'yellow' },
  134: { label: 'INDYWIDUALNE-NOWE', color: 'blue' },
  137: { label: 'INDYWIDUALNE-W REALIZACJI', color: 'yellow' },
  155: { label: 'HOUSE NOWE', color: 'blue' },
  158: { label: 'HOUSE PRODUKCJA', color: 'yellow' },
  161: { label: 'HOUSE WYPRODUKOWANE', color: 'green' },
  85:  { label: 'MEBLE DOSYŁKA', color: 'purple' },
  110: { label: 'Dosyłka', color: 'purple' },
  60:  { label: 'ETYKIETY DO ZR', color: 'gray' },
  97:  { label: 'ZAM DO WYJAŚ', color: 'orange' },
  100: { label: 'WYJAŚNIONE', color: 'green' },
  214: { label: 'UPS DO WYJASNIENIA', color: 'orange' },
  217: { label: 'UPS WYJASNIONE', color: 'green' },
  233: { label: 'DO WYJASNIENIA KAROLA', color: 'orange' },
  63:  { label: 'ODSTĄPIENIE OD UMOWY', color: 'red' },
  81:  { label: 'BEZ ODBIORU', color: 'red' },
  223: { label: 'ZWROT NIEMCY', color: 'red' },
  69:  { label: 'BARCZEWO WRÓCIŁO', color: 'red' },
  78:  { label: 'ZWRÓCONE ŚRODKI', color: 'green' },
  231: { label: 'WRÓCIŁO POLSKA', color: 'red' },
  188: { label: 'AMAZON W BLu', color: 'yellow' },
};

export async function GET(request) {
  try {
    await initDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const limit = Math.min(parseInt(searchParams.get('limit')) || 5000, 5000);
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
              ordered_at, shipping_date, items, customer, shipping,
              total_gross, currency, delivery_status, payment_status, is_canceled
            FROM orders
            WHERE ordered_at >= ${dateFrom} AND ordered_at < ${dateTo + 'T23:59:59'}
            ORDER BY ordered_at DESC
            LIMIT ${limit}
          `
        : await sql`
            SELECT
              id, external_id, channel_label, channel_platform,
              ordered_at, shipping_date, items, customer, shipping,
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
              ordered_at, shipping_date, items, customer, shipping,
              total_gross, currency, delivery_status, payment_status, is_canceled
            FROM orders
            WHERE ordered_at >= ${dateFrom} AND ordered_at < ${dateTo + 'T23:59:59'}
            ORDER BY ordered_at DESC
            LIMIT ${limit}
          `
        : await sql`
            SELECT
              id, external_id, channel_label, channel_platform,
              ordered_at, shipping_date, items, customer, shipping,
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
      if (!isCanceled && isPaid) {
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
        shippingDate: order.shipping_date,
        customer: order.customer,
        shipping: order.shipping,
        totalGross: order.total_gross,
        currency: order.currency,
        deliveryStatus: order.delivery_status,
        omsStatus: OMS_STATUS_MAP[order.delivery_status]?.label || (order.delivery_status != null ? `#${order.delivery_status}` : null),
        omsStatusColor: OMS_STATUS_MAP[order.delivery_status]?.color || 'gray',
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

    // OMS status counts
    const omsStatusCounts = {};
    for (const o of processedOrders) {
      if (o.deliveryStatus != null) {
        const key = o.deliveryStatus;
        if (!omsStatusCounts[key]) {
          const info = OMS_STATUS_MAP[key];
          omsStatusCounts[key] = {
            status: key,
            label: info?.label || `#${key}`,
            color: info?.color || 'gray',
            count: 0
          };
        }
        omsStatusCounts[key].count++;
      }
    }

    const stats = {
      total: processedOrders.length,
      readyToShip: processedOrders.filter(o => o.orderStatus === 'ready_to_ship').length,
      needsProduction: processedOrders.filter(o => o.orderStatus === 'needs_production').length,
      partial: processedOrders.filter(o => o.orderStatus === 'partial').length,
      shipped: processedOrders.filter(o => o.orderStatus === 'shipped').length,
      canceled: processedOrders.filter(o => o.orderStatus === 'canceled').length,
      unpaid: processedOrders.filter(o => o.orderStatus === 'unpaid').length,
      omsStatuses: Object.values(omsStatusCounts).sort((a, b) => b.count - a.count),
      departments: {
        wszystkie: processedOrders.length,
        poczekalnia: processedOrders.filter(o => o.department === null).length,
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
