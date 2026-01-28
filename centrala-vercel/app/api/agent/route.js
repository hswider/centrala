import { NextResponse } from 'next/server';
import {
  getTodayStats,
  getYesterdayStats,
  getLast7DaysStats,
  getLast30DaysStats,
  getThisMonthStats,
  getLastMonthStats,
  getStatsByPlatformLast7Days,
  getDailyStatsLast14Days,
  getTopProductsLast30Days,
  getOverallStats,
  searchOrderForAgent,
  getAIMemories,
  saveAIMemory
} from '@/lib/db';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Detect memory commands in user message
function detectMemoryCommand(message) {
  const lowerMessage = message.toLowerCase();

  // Patterns for "remember" commands
  const rememberPatterns = [
    /zapami[eę]taj[,:]?\s*(.+)/i,
    /pami[eę]taj[,:]?\s*[żz]e\s*(.+)/i,
    /zapisz[,:]?\s*[żz]e\s*(.+)/i,
    /dodaj do pami[eę]ci[,:]?\s*(.+)/i,
    /naucz si[eę][,:]?\s*[żz]e\s*(.+)/i,
    /od teraz[,:]?\s*(.+)/i,
    /zapami[eę]taj sobie[,:]?\s*(.+)/i
  ];

  for (const pattern of rememberPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return {
        action: 'remember',
        fact: match[1].trim()
      };
    }
  }

  // Patterns for "forget" commands
  const forgetPatterns = [
    /zapomnij[,:]?\s*(.+)/i,
    /usu[nń] z pami[eę]ci[,:]?\s*(.+)/i,
    /wyma[żz][,:]?\s*(.+)/i
  ];

  for (const pattern of forgetPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return {
        action: 'forget',
        fact: match[1].trim()
      };
    }
  }

  // Pattern for listing memories
  if (lowerMessage.includes('co pamiętasz') ||
      lowerMessage.includes('co pamietasz') ||
      lowerMessage.includes('pokaż pamięć') ||
      lowerMessage.includes('pokaz pamiec') ||
      lowerMessage.includes('lista wspomnień') ||
      lowerMessage.includes('lista wspomnien') ||
      lowerMessage.includes('twoja pamięć') ||
      lowerMessage.includes('twoja pamiec')) {
    return { action: 'list' };
  }

  return null;
}

// Currency conversion
const EUR_TO_PLN = 4.35;

// Extract potential order IDs from message
function extractOrderIds(message) {
  // Match patterns like: AM260101910, 12345678, #12345, order numbers
  const patterns = [
    /[A-Z]{2}\d{6,}/gi,  // AM260101910
    /\b\d{7,}\b/g,        // 12345678
    /#(\d{4,})/g,         // #12345
  ];

  const ids = new Set();
  for (const pattern of patterns) {
    const matches = message.match(pattern);
    if (matches) {
      matches.forEach(m => ids.add(m.replace('#', '')));
    }
  }

  return Array.from(ids);
}

// Format order for AI context
function formatOrderForAI(order) {
  const items = order.items
    .filter(item => !item.isShipping)
    .map(item => `  - ${item.name} (SKU: ${item.sku || 'brak'}) x${item.quantity} = ${item.totalGross?.toFixed(2) || item.priceGross?.toFixed(2)} ${order.currency}`)
    .join('\n');

  const customer = order.customer || {};
  const shipping = order.shipping || {};

  return `
ZAMÓWIENIE ${order.externalId || order.id}:
- ID wewnętrzne: ${order.id}
- Platforma: ${order.channel} (${order.channelLabel})
- Data: ${order.orderedAt ? new Date(order.orderedAt).toLocaleString('pl-PL') : 'brak'}
- Status płatności: ${order.paymentStatus}
- Status dostawy: ${order.deliveryStatus}
- Wartość: ${order.totalGross?.toFixed(2)} ${order.currency}

KLIENT:
- Imię i nazwisko: ${customer.name || 'brak'}
- Email: ${customer.email || 'brak'}
- Telefon: ${customer.phone || 'brak'}
- Firma: ${customer.companyName || 'brak'}

ADRES DOSTAWY:
- ${shipping.name || customer.name || 'brak'}
- ${shipping.street || ''} ${shipping.streetNumber || ''}
- ${shipping.zipCode || ''} ${shipping.city || ''}
- ${shipping.country || ''}

PRODUKTY:
${items || '  Brak produktów'}
`;
}

// Gather context data for AI using PostgreSQL CURRENT_DATE for consistency
async function gatherContextData() {
  try {
    const [
      todayStats,
      yesterdayStats,
      last7DaysStats,
      last30DaysStats,
      thisMonthStats,
      lastMonthStats,
      byPlatform,
      dailyStats,
      topProducts,
      overallStats
    ] = await Promise.all([
      getTodayStats(),
      getYesterdayStats(),
      getLast7DaysStats(),
      getLast30DaysStats(),
      getThisMonthStats(),
      getLastMonthStats(),
      getStatsByPlatformLast7Days(),
      getDailyStatsLast14Days(),
      getTopProductsLast30Days(10),
      getOverallStats()
    ]);

    return {
      currentDate: new Date().toISOString().split('T')[0],
      today: {
        orders: todayStats.order_count || 0,
        revenuePln: todayStats.total_revenue_pln || 0,
        avgOrderValuePln: todayStats.avg_order_value_pln || 0
      },
      yesterday: {
        orders: yesterdayStats.order_count || 0,
        revenuePln: yesterdayStats.total_revenue_pln || 0,
        avgOrderValuePln: yesterdayStats.avg_order_value_pln || 0
      },
      last7Days: {
        orders: last7DaysStats.order_count || 0,
        revenuePln: last7DaysStats.total_revenue_pln || 0,
        avgOrderValuePln: last7DaysStats.avg_order_value_pln || 0,
        byPlatform: byPlatform.map(p => ({
          platform: p.channel_platform,
          orders: parseInt(p.order_count) || 0,
          revenue: parseFloat(p.total_revenue) || 0
        }))
      },
      last30Days: {
        orders: last30DaysStats.order_count || 0,
        revenuePln: last30DaysStats.total_revenue_pln || 0,
        avgOrderValuePln: last30DaysStats.avg_order_value_pln || 0,
        dailyBreakdown: dailyStats.map(d => ({
          date: d.date,
          orders: parseInt(d.order_count) || 0,
          revenue: parseFloat(d.total_revenue) || 0
        }))
      },
      thisMonth: {
        orders: thisMonthStats.order_count || 0,
        revenuePln: thisMonthStats.total_revenue_pln || 0
      },
      lastMonth: {
        orders: lastMonthStats.order_count || 0,
        revenuePln: lastMonthStats.total_revenue_pln || 0
      },
      topProducts: topProducts.map(p => ({
        name: p.product_name,
        sku: p.sku,
        quantity: parseInt(p.total_quantity) || 0,
        orders: parseInt(p.order_count) || 0
      })),
      overall: {
        totalOrders: parseInt(overallStats.total_orders) || 0,
        totalRevenue: parseFloat(overallStats.total_revenue) || 0,
        avgOrderValue: parseFloat(overallStats.avg_order_value) || 0,
        platformCount: parseInt(overallStats.platform_count) || 0,
        canceledOrders: parseInt(overallStats.canceled_orders) || 0
      },
      conversionRate: EUR_TO_PLN
    };
  } catch (error) {
    console.error('[Agent] Error gathering context:', error);
    return null;
  }
}

// Call Groq API (free and fast)
async function callGroq(message, contextData, orderData = [], history = [], memories = []) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY nie jest skonfigurowany. Dodaj go do zmiennych środowiskowych w Vercel.');
  }

  // Format order data if present
  const orderContext = orderData.length > 0
    ? '\n\n=== ZNALEZIONE ZAMÓWIENIA ===\n' + orderData.map(o => formatOrderForAI(o)).join('\n---\n')
    : '';

  // Format memories if present
  const memoriesContext = memories.length > 0
    ? '\n\n=== TWOJA PAMIĘĆ (zapamiętane informacje) ===\nPoniższe informacje zostały zapamiętane z poprzednich rozmów. Używaj ich odpowiadając na pytania:\n' + memories.map((m, i) => `${i+1}. ${m.fact}`).join('\n')
    : '';

  const systemPrompt = `Jesteś asystentem AI dla systemu CENTRALA POOM - wewnętrznej aplikacji firmy POOM Wood do zarządzania sprzedażą wielokanałową. Odpowiadasz po polsku.

=== O FIRMIE POOM WOOD ===
POOM Wood to polska firma produkująca i sprzedająca meble drewniane (łóżka, komody, szafy, stoliki nocne, regały). Firma prowadzi sprzedaż na wielu platformach e-commerce w Polsce i Europie. Główne marki:
- Dobrelegowiska.pl - meble w Polsce (Allegro, Shopify)
- Allepoduszki.pl - poduszki i akcesoria (Shopify)
- poom-furniture.com - meble w Europie (Shopify)
- POOMKIDS - meble dziecięce (Shopify)
- Meblebox - meble na Allegro

=== MODUŁY SYSTEMU CENTRALA ===

📊 DASHBOARD (strona główna)
- Przegląd dziennych, tygodniowych i miesięcznych statystyk sprzedaży
- Wykresy obrotu i liczby zamówień
- Podział sprzedaży według platform
- Top produkty

📦 OMS (Order Management System) - /zamowienia
- Lista wszystkich zamówień z wszystkich platform
- Filtrowanie po platformie, statusie, dacie
- Wyszukiwanie zamówień po numerze, kliencie, produkcie
- Szczegóły zamówienia: produkty, dane klienta, adres dostawy, płatności
- Synchronizacja z systemem ERP Apilo (poom.apilo.com)

🏭 WMS (Warehouse Management System) - /magazyny, /wms
- Zarządzanie stanami magazynowymi
- Lokalizacje produktów w magazynie
- Historia ruchów magazynowych
- Alerty o niskich stanach

⚙️ MES (Manufacturing Execution System) - /mes
- Zarządzanie produkcją mebli
- Zlecenia produkcyjne
- Harmonogram produkcji
- Śledzenie postępu produkcji

📋 MTS (Material Tracking System) - /mts
- Śledzenie materiałów i surowców
- Zamówienia materiałów
- Stan surowców

📄 DMS (Document Management System) - /dms
- Zarządzanie dokumentami firmowymi
- Faktury, umowy, specyfikacje
- Przechowywanie i wyszukiwanie dokumentów

🖥️ ECOM (E-commerce Management) - /ecom
- Zarządzanie ofertami na platformach
- Synchronizacja produktów
- Zarządzanie cenami i promocjami
- Monitorowanie czasów dostawy

👥 CRM PL (Customer Relationship Management - Polska) - /crm
Obsługa klientów na rynku polskim:
- **Allegro Dobrelegowiska** - wiadomości od klientów z Allegro (konto Dobrelegowiska)
- **Allegro Meblebox** - wiadomości z konta Meblebox
- **Shopify Dobrelegowiska** - maile klientów sklepu dobrelegowiska.pl (Gmail)
- **Shopify Allepoduszki** - maile klientów sklepu allepoduszki.pl (Gmail)
- **Kaufland** - zgłoszenia klientów z Kaufland

Funkcje CRM:
- Statusy wiadomości: Nowe, Przeczytane, Wymaga uwagi (żółty), Rozwiązane, Wysłane
- Wysyłanie odpowiedzi
- Przekazywanie wiadomości
- Usuwanie wątków
- Alerty o nowych wiadomościach w nawigacji

👥 CRM EU (Customer Relationship Management - Europa) - /crm-eu
Obsługa klientów międzynarodowych:
- **Shopify poom-furniture.com** - maile klientów europejskich (Gmail)
- **Shopify POOMKIDS** - maile klientów POOMKIDS (Gmail)
- **Amazon DE** - wiadomości od klientów Amazon Niemcy (Gmail)

📈 RANK - /rank
- Rankingi sprzedaży
- Porównanie wyników między platformami
- Analiza trendów

🤖 ASYSTENT AI - /agent
- Ty! Odpowiadasz na pytania o sprzedaż i system
- Wyszukujesz zamówienia po numerze
- Podajesz statystyki

=== PLATFORMY SPRZEDAŻY ===
System integruje się z następującymi platformami:
- **Allegro** - największy marketplace w Polsce
- **Amazon** (DE, inne kraje) - sprzedaż w Niemczech i Europie
- **Shopify** - własne sklepy internetowe (dobrelegowiska.pl, allepoduszki.pl, poom-furniture.com)
- **Kaufland** - marketplace Kaufland
- **eBay** - aukcje międzynarodowe
- **Cdiscount** - marketplace francuski
- **Zamówienia ręczne** - zamówienia wprowadzane ręcznie

=== STATUSY ZAMÓWIEŃ ===
- Status płatności: PAID (opłacone), UNPAID (nieopłacone)
- Status dostawy: różne kody numeryczne zależne od kuriera
- Zamówienia anulowane są oznaczone flagą is_canceled

=== INTEGRACJE ===
- **Apilo ERP** (poom.apilo.com) - główny system ERP, źródło zamówień
- **Gmail API** - obsługa maili klientów dla sklepów Shopify
- **Allegro API** - wiadomości i zamówienia z Allegro
- **Kaufland API** - zgłoszenia klientów
- **Baselinker** - integracja z marketplace'ami

=== UŻYTKOWNICY ===
System ma role użytkowników:
- Admin - pełny dostęp do wszystkich modułów
- User - ograniczony dostęp według uprawnień
- Billing - dostęp do modułów związanych z zamówieniami

=== WAŻNE ZASADY ODPOWIEDZI ===
- Odpowiadaj krótko i konkretnie
- Pamiętaj kontekst rozmowy - możesz odwoływać się do poprzednich pytań
- Wszystkie kwoty statystyk są już przeliczone na PLN (kurs EUR: 4.35 PLN)
- Używaj polskiego formatowania walut (np. "1 234,56 PLN")
- Formatuj liczby z separatorami tysięcy (spacja jako separator)
- Jeśli użytkownik pyta o konkretne zamówienie, szukaj go w sekcji "ZNALEZIONE ZAMÓWIENIA"
- Jeśli nie masz danych na dane pytanie, powiedz o tym wprost
- Możesz sugerować, w którym module systemu użytkownik znajdzie potrzebne informacje

AKTUALNE DANE (stan na ${contextData?.currentDate || 'teraz'}):

DZISIAJ:
- Zamówień: ${contextData?.today?.orders || 0}
- Obrót: ${Math.round(contextData?.today?.revenuePln || 0).toLocaleString('pl-PL')} PLN
- Średnia wartość zamówienia: ${Math.round(contextData?.today?.avgOrderValuePln || 0).toLocaleString('pl-PL')} PLN

WCZORAJ:
- Zamówień: ${contextData?.yesterday?.orders || 0}
- Obrót: ${Math.round(contextData?.yesterday?.revenuePln || 0).toLocaleString('pl-PL')} PLN
- Średnia wartość zamówienia: ${Math.round(contextData?.yesterday?.avgOrderValuePln || 0).toLocaleString('pl-PL')} PLN

OSTATNIE 7 DNI:
- Zamówień: ${contextData?.last7Days?.orders || 0}
- Obrót: ${Math.round(contextData?.last7Days?.revenuePln || 0).toLocaleString('pl-PL')} PLN

OSTATNIE 30 DNI:
- Zamówień: ${contextData?.last30Days?.orders || 0}
- Obrót: ${Math.round(contextData?.last30Days?.revenuePln || 0).toLocaleString('pl-PL')} PLN

TEN MIESIĄC:
- Zamówień: ${contextData?.thisMonth?.orders || 0}
- Obrót: ${Math.round(contextData?.thisMonth?.revenuePln || 0).toLocaleString('pl-PL')} PLN

POPRZEDNI MIESIĄC:
- Zamówień: ${contextData?.lastMonth?.orders || 0}
- Obrót: ${Math.round(contextData?.lastMonth?.revenuePln || 0).toLocaleString('pl-PL')} PLN

PLATFORMY (ostatnie 7 dni):
${contextData?.last7Days?.byPlatform?.map(p => `- ${p.platform}: ${p.orders} zamówień`).join('\n') || 'Brak danych'}

TOP 10 PRODUKTÓW (ostatnie 30 dni):
${contextData?.topProducts?.map((p, i) => `${i+1}. ${p.name} (${p.sku || 'brak SKU'}): ${p.quantity} szt.`).join('\n') || 'Brak danych'}

OGÓLNE STATYSTYKI:
- Wszystkie zamówienia w bazie: ${contextData?.overall?.totalOrders || 0}
- Anulowane: ${contextData?.overall?.canceledOrders || 0}
- Liczba platform: ${contextData?.overall?.platformCount || 0}${memoriesContext}${orderContext}`;

  // Build messages array with history
  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  // Add conversation history (skip the last message as it's the current one)
  if (history.length > 1) {
    const previousMessages = history.slice(0, -1);
    for (const msg of previousMessages) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
  }

  // Add current message
  messages.push({ role: 'user', content: message });

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Groq API error');
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'Brak odpowiedzi';
}

export async function POST(request) {
  try {
    const { message, history = [] } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Brak wiadomości' },
        { status: 400 }
      );
    }

    console.log('[Agent] Received question:', message, '| History length:', history.length);

    // Load memories from database
    const memories = await getAIMemories();
    console.log('[Agent] Loaded memories:', memories.length);

    // Check for memory commands
    const memoryCommand = detectMemoryCommand(message);

    if (memoryCommand) {
      if (memoryCommand.action === 'remember') {
        // Save new memory
        try {
          await saveAIMemory(memoryCommand.fact);
          console.log('[Agent] Saved new memory:', memoryCommand.fact);
          return NextResponse.json({
            response: `Zapamiętałem: "${memoryCommand.fact}"\n\nBędę pamiętał tę informację w przyszłych rozmowach.`,
            timestamp: new Date().toISOString(),
            memoryAction: 'saved'
          });
        } catch (err) {
          return NextResponse.json({
            response: `Nie udało się zapamiętać: ${err.message}`,
            timestamp: new Date().toISOString()
          });
        }
      }

      if (memoryCommand.action === 'list') {
        // List all memories
        if (memories.length === 0) {
          return NextResponse.json({
            response: 'Moja pamięć jest pusta. Możesz dodać nowe informacje mówiąc np. "Zapamiętaj, że firma to poom-furniture".',
            timestamp: new Date().toISOString()
          });
        }

        const memoryList = memories.map((m, i) => `${i+1}. ${m.fact}`).join('\n');
        return NextResponse.json({
          response: `Oto co pamiętam:\n\n${memoryList}\n\nMożesz dodać nowe informacje mówiąc "Zapamiętaj..." lub usunąć mówiąc "Zapomnij...".`,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Gather context data from database
    const contextData = await gatherContextData();

    if (!contextData) {
      return NextResponse.json(
        { error: 'Nie udało się pobrać danych z bazy' },
        { status: 500 }
      );
    }

    // Check if user is asking about specific orders - search in current message AND history
    let orderIds = extractOrderIds(message);

    // Also search for order IDs in conversation history
    if (history && history.length > 0) {
      for (const msg of history) {
        if (msg.content) {
          const historyIds = extractOrderIds(msg.content);
          orderIds = orderIds.concat(historyIds);
        }
      }
    }

    // Remove duplicates from order IDs
    orderIds = [...new Set(orderIds)];

    let orderData = [];

    if (orderIds.length > 0) {
      console.log('[Agent] Searching for orders:', orderIds);
      for (const orderId of orderIds) {
        const orders = await searchOrderForAgent(orderId);
        orderData = orderData.concat(orders);
      }
      // Remove duplicates
      const seen = new Set();
      orderData = orderData.filter(o => {
        if (seen.has(o.id)) return false;
        seen.add(o.id);
        return true;
      });
      console.log('[Agent] Found orders:', orderData.length);
    }

    // Call Groq (free API) with conversation history and memories
    const aiResponse = await callGroq(message, contextData, orderData, history, memories);

    console.log('[Agent] Response generated successfully');

    return NextResponse.json({
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Agent] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Wystąpił błąd' },
      { status: 500 }
    );
  }
}
