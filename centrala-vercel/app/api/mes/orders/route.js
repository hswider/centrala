import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { initDatabase } from '@/lib/db';

export async function GET(request) {
  try {
    await initDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all'; // pending, ready, all, shipped
    const limit = parseInt(searchParams.get('limit')) || 500;
    const includeAll = status === 'all';

    // Data początku lutego 2026
    const februaryStart = '2026-02-01';

    console.log('[MES API] Request params:', { status, limit, includeAll });

    // Pobierz zamówienia od początku lutego
    // Dla 'all' - pobierz WSZYSTKIE zamówienia bez filtrów (włącznie z wysłanymi, anulowanymi, nieopłaconymi)
    const orders = includeAll
      ? await sql`
          SELECT
            id,
            external_id,
            channel_label,
            channel_platform,
            ordered_at,
            items,
            customer,
            shipping,
            total_gross,
            currency,
            delivery_status,
            payment_status,
            is_canceled
          FROM orders
          WHERE ordered_at >= ${februaryStart}
          ORDER BY ordered_at DESC
          LIMIT ${limit}
        `
      : await sql`
          SELECT
            id,
            external_id,
            channel_label,
            channel_platform,
            ordered_at,
            items,
            customer,
            shipping,
            total_gross,
            currency,
            delivery_status,
            payment_status,
            is_canceled
          FROM orders
          WHERE payment_status = 'PAID'
            AND ordered_at >= ${februaryStart}
            AND (delivery_status IS NULL OR delivery_status NOT IN (13, 19, 16))
            AND is_canceled = false
          ORDER BY ordered_at DESC
          LIMIT ${limit}
        `;

    console.log('[MES API] Orders from DB:', orders.rows.length);

    // Pobierz wszystkie produkty z inventory pogrupowane po kategorii
    const inventory = await sql`
      SELECT id, sku, nazwa, stan, kategoria, cena
      FROM inventory
      WHERE stan > 0
    `;

    // Zbuduj mapę inventory po SKU i kategorii
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

    // Pobierz receptury dla produktów gotowych
    const recipes = await sql`
      SELECT
        r.product_id,
        r.ingredient_id,
        r.quantity,
        i.sku as ingredient_sku,
        i.nazwa as ingredient_nazwa,
        i.kategoria as ingredient_kategoria,
        i.stan as ingredient_stan
      FROM recipes r
      JOIN inventory i ON r.ingredient_id = i.id
    `;

    // Zbuduj mapę receptur po product_id
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

    // Przetwórz zamówienia
    const processedOrders = orders.rows.map(order => {
      const items = order.items || [];

      const processedItems = items
        .filter(item => !item.isShipping)
        .map(item => {
          const sku = (item.sku || '').toUpperCase().trim();
          const quantity = parseInt(item.quantity) || 1;

          // Sprawdź dostępność na każdym poziomie
          const availability = {
            gotowe: inventoryMap.gotowe[sku] || null,
            polprodukty: null, // Szukamy po części SKU lub nazwie
            wykroje: null,
            surowce: null
          };

          // Znajdź pasujące półprodukty, wykroje (po części nazwy/sku)
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

          // Określ status produkcji
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

          // Pobierz recepturę jeśli produkt jest w inventory gotowe
          let recipe = null;
          if (availability.gotowe) {
            recipe = recipeMap[availability.gotowe.id] || null;
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
            recipe
          };
        });

      // Określ ogólny status zamówienia
      const allReady = processedItems.every(i => i.productionStatus === 'ready');
      const anyNeedsProduction = processedItems.some(i =>
        ['needs_production', 'from_surowce', 'from_wykroje', 'from_polprodukty'].includes(i.productionStatus)
      );

      // Sprawdź czy zamówienie jest już wysłane lub anulowane
      // Status 13 = Wysłane, 19 = Anulowane, 16 = Zduplikowane
      // Statusy > 13 to zazwyczaj statusy produktowe (PALETY, PIKÓWKI, etc.) - NIE oznaczają wysłane!
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
        paymentStatus: order.payment_status,
        isCanceled,
        isPaid,
        items: processedItems,
        orderStatus,
        isShipped,
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
    // status === 'all' - zwróć wszystkie

    // Statystyki
    const stats = {
      total: processedOrders.length,
      readyToShip: processedOrders.filter(o => o.orderStatus === 'ready_to_ship').length,
      needsProduction: processedOrders.filter(o => o.orderStatus === 'needs_production').length,
      partial: processedOrders.filter(o => o.orderStatus === 'partial').length,
      shipped: processedOrders.filter(o => o.orderStatus === 'shipped').length,
      canceled: processedOrders.filter(o => o.orderStatus === 'canceled').length,
      unpaid: processedOrders.filter(o => o.orderStatus === 'unpaid').length
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
