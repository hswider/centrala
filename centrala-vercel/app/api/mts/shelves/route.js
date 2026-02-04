import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { initDatabase } from '@/lib/db';

export async function GET(request) {
  try {
    await initDatabase();

    const { searchParams } = new URL(request.url);
    const shelf = searchParams.get('shelf') || 'gotowe'; // gotowe | polprodukty | wykroje
    const safetyFactor = parseFloat(searchParams.get('safetyFactor')) || 1.2;

    // Okresy analizy dla kazdego regalu
    const analysisPeriods = {
      gotowe: 7,
      polprodukty: 14,
      wykroje: 30
    };

    const days = analysisPeriods[shelf] || 7;

    // Normalizacja SKU
    const normalizeSku = (sku) => (sku || '').toUpperCase().trim().replace(/\s+/g, '-');

    // Pobierz trendy sprzedazy gotowych produktow (zawsze potrzebne do obliczenia zapotrzebowania)
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

    // Dozwolone SKU gotowych produktow (PUFAPOKROWIEC)
    const allowedGotoweSku = [
      'PUFAPOKROWIEC-SKU-001',
      'PUFAPOKROWIEC-SKU-002',
      'PUFAPOKROWIEC-SKU-003',
      'PUFAPOKROWIEC-SKU-004',
      'PUFAPOKROWIEC-SKU-005'
    ];

    // Buduj mapę sprzedazy gotowych produktow (tylko dozwolone SKU)
    const salesMap = {};
    salesTrends.rows.forEach(row => {
      const key = normalizeSku(row.sku);
      // Filtruj tylko dozwolone produkty gotowe
      if (!allowedGotoweSku.includes(key)) return;

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

    // Pobierz stany inventory dla wybranego regalu
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
      WHERE kategoria = ${shelf}
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

    // Pobierz wszystkie receptury
    const allRecipes = await sql`
      SELECT
        r.product_id,
        r.ingredient_id,
        r.quantity,
        p.sku as product_sku,
        p.kategoria as product_kategoria,
        i.sku as ingredient_sku,
        i.kategoria as ingredient_kategoria,
        i.nazwa as ingredient_nazwa
      FROM recipes r
      JOIN inventory p ON r.product_id = p.id
      JOIN inventory i ON r.ingredient_id = i.id
    `;

    // Buduj mapę receptur: product_sku -> [{ ingredientSku, quantity, kategoria }]
    // Krok 1: Zbierz receptury tylko dla dozwolonych produktow gotowych
    const recipeMap = {};
    const allowedPolprodukty = new Set(); // Polprodukty uzywane w dozwolonych produktach

    allRecipes.rows.forEach(row => {
      const productKey = normalizeSku(row.product_sku);
      // Najpierw dodaj receptury dla dozwolonych produktow gotowych
      if (allowedGotoweSku.includes(productKey)) {
        if (!recipeMap[productKey]) {
          recipeMap[productKey] = [];
        }
        recipeMap[productKey].push({
          ingredientSku: normalizeSku(row.ingredient_sku),
          ingredientNazwa: row.ingredient_nazwa,
          quantity: parseFloat(row.quantity) || 1,
          kategoria: row.ingredient_kategoria
        });
        // Zapamietaj polprodukty uzywane w tych recepturach
        if (row.ingredient_kategoria === 'polprodukty') {
          allowedPolprodukty.add(normalizeSku(row.ingredient_sku));
        }
      }
    });

    // Krok 2: Dodaj receptury dla polproduktow (potrzebne do obliczenia wykrojow)
    allRecipes.rows.forEach(row => {
      const productKey = normalizeSku(row.product_sku);
      if (allowedPolprodukty.has(productKey)) {
        if (!recipeMap[productKey]) {
          recipeMap[productKey] = [];
        }
        // Sprawdz czy juz nie dodano tego skladnika
        const exists = recipeMap[productKey].some(i => i.ingredientSku === normalizeSku(row.ingredient_sku));
        if (!exists) {
          recipeMap[productKey].push({
            ingredientSku: normalizeSku(row.ingredient_sku),
            ingredientNazwa: row.ingredient_nazwa,
            quantity: parseFloat(row.quantity) || 1,
            kategoria: row.ingredient_kategoria
          });
        }
      }
    });

    let products = [];

    if (shelf === 'gotowe') {
      // Dla gotowych produktow - prosta analiza tylko dla dozwolonych SKU
      const allKeys = new Set([...Object.keys(inventoryMap), ...Object.keys(salesMap)]);

      allKeys.forEach(key => {
        // Filtruj tylko dozwolone SKU dla gotowych
        if (!allowedGotoweSku.includes(key)) return;

        const inv = inventoryMap[key];
        const sales = salesMap[key];

        if (!sales && (!inv || inv.currentStock === 0)) return;

        const totalSold = sales?.totalSold || 0;
        const avgDaily = totalSold / days;
        const periodDemand = avgDaily * days * safetyFactor;
        const currentStock = inv?.currentStock || 0;
        const deficit = currentStock - periodDemand;
        const toProduce = deficit < 0 ? Math.ceil(Math.abs(deficit)) : 0;

        let priority = 'ok';
        if (deficit < -periodDemand * 0.5) {
          priority = 'critical';
        } else if (deficit < 0) {
          priority = 'warning';
        }

        products.push({
          id: inv?.id || null,
          sku: inv?.sku || sales?.sku || key,
          nazwa: inv?.nazwa || sales?.nazwa || key,
          currentStock: Math.round(currentStock * 100) / 100,
          totalSold,
          avgDaily: Math.round(avgDaily * 100) / 100,
          periodDemand: Math.round(periodDemand),
          deficit: Math.round(deficit),
          toProduce,
          priority,
          inInventory: !!inv
        });
      });
    } else {
      // Dla polproduktow i wykrojow - oblicz zapotrzebowanie na podstawie receptur
      // Przejdz przez sprzedaz gotowych produktow i oblicz zapotrzebowanie na skladniki
      const ingredientDemand = {};

      Object.entries(salesMap).forEach(([productSku, sales]) => {
        const recipe = recipeMap[productSku];
        if (!recipe) return;

        const avgDaily = sales.totalSold / days;
        const periodDemand = avgDaily * days * safetyFactor;

        recipe.forEach(ingredient => {
          // Filtruj skladniki wedlug kategorii regalu
          if (ingredient.kategoria !== shelf) return;

          if (!ingredientDemand[ingredient.ingredientSku]) {
            ingredientDemand[ingredient.ingredientSku] = {
              nazwa: ingredient.ingredientNazwa,
              totalDemand: 0,
              usedIn: []
            };
          }
          ingredientDemand[ingredient.ingredientSku].totalDemand += periodDemand * ingredient.quantity;
          ingredientDemand[ingredient.ingredientSku].usedIn.push({
            productSku,
            productName: sales.nazwa,
            quantity: ingredient.quantity,
            demand: Math.round(periodDemand * ingredient.quantity)
          });
        });
      });

      // Dla polproduktow - dodaj tez zapotrzebowanie z receptur polproduktow na wykroje
      if (shelf === 'wykroje') {
        // Przejdz przez zapotrzebowanie na polprodukty i oblicz zapotrzebowanie na wykroje
        const polproduktDemand = {};

        Object.entries(salesMap).forEach(([productSku, sales]) => {
          const recipe = recipeMap[productSku];
          if (!recipe) return;

          const avgDaily = sales.totalSold / days;
          const periodDemand = avgDaily * days * safetyFactor;

          recipe.forEach(ingredient => {
            if (ingredient.kategoria !== 'polprodukty') return;

            if (!polproduktDemand[ingredient.ingredientSku]) {
              polproduktDemand[ingredient.ingredientSku] = 0;
            }
            polproduktDemand[ingredient.ingredientSku] += periodDemand * ingredient.quantity;
          });
        });

        // Teraz oblicz zapotrzebowanie na wykroje z polproduktow
        Object.entries(polproduktDemand).forEach(([polproduktSku, demand]) => {
          const recipe = recipeMap[polproduktSku];
          if (!recipe) return;

          recipe.forEach(ingredient => {
            if (ingredient.kategoria !== 'wykroje') return;

            if (!ingredientDemand[ingredient.ingredientSku]) {
              ingredientDemand[ingredient.ingredientSku] = {
                nazwa: ingredient.ingredientNazwa,
                totalDemand: 0,
                usedIn: []
              };
            }
            ingredientDemand[ingredient.ingredientSku].totalDemand += demand * ingredient.quantity;
          });
        });
      }

      // Polacz z inventory i oblicz deficyt
      Object.entries(inventoryMap).forEach(([key, inv]) => {
        const demand = ingredientDemand[key];
        const totalDemand = demand?.totalDemand || 0;
        const currentStock = inv.currentStock;
        const deficit = currentStock - totalDemand;
        const toProduce = deficit < 0 ? Math.ceil(Math.abs(deficit)) : 0;

        let priority = 'ok';
        if (deficit < -totalDemand * 0.3) {
          priority = 'critical';
        } else if (deficit < 0) {
          priority = 'warning';
        }

        products.push({
          id: inv.id,
          sku: inv.sku,
          nazwa: inv.nazwa,
          currentStock: Math.round(currentStock * 100) / 100,
          totalDemand: Math.round(totalDemand),
          avgDaily: Math.round((totalDemand / days) * 100) / 100,
          deficit: Math.round(deficit),
          toProduce,
          priority,
          inInventory: true,
          usedIn: demand?.usedIn || []
        });
      });

      // Dodaj skladniki z zapotrzebowaniem ale bez pozycji w inventory
      Object.entries(ingredientDemand).forEach(([key, demand]) => {
        if (inventoryMap[key]) return; // Juz dodane

        products.push({
          id: null,
          sku: key,
          nazwa: demand.nazwa,
          currentStock: 0,
          totalDemand: Math.round(demand.totalDemand),
          avgDaily: Math.round((demand.totalDemand / days) * 100) / 100,
          deficit: -Math.round(demand.totalDemand),
          toProduce: Math.ceil(demand.totalDemand),
          priority: 'critical',
          inInventory: false,
          usedIn: demand.usedIn
        });
      });
    }

    // Sortuj po deficycie
    products.sort((a, b) => a.deficit - b.deficit);

    // Statystyki
    const summary = {
      shelf,
      analysisDays: days,
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
        shelf,
        analysisDays: days,
        safetyFactor,
        generatedAt: new Date().toISOString(),
        summary,
        products
      }
    });
  } catch (error) {
    console.error('[API] MTS Shelves error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
