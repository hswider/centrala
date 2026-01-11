# Centrala POOM — Dashboard Zamówień Apilo

## 1. Informacje Ogólne

**Produkcja:** https://centrala-poom.vercel.app/

**Centrala POOM** to wewnętrzna aplikacja dashboardowa do zarządzania zamówieniami z systemu ERP Apilo (instancja: poom.apilo.com). Aplikacja synchronizuje zamówienia z wielu platform e-commerce i wyświetla je w przejrzystym interfejsie z wykresami i statystykami.

### Obsługiwane platformy sprzedaży:
- Amazon
- Allegro
- Shopify
- Kaufland
- eBay
- Cdiscount
- Zamówienia ręczne

## 2. Tech Stack (Produkcja - Vercel)

| Technologia | Wersja | Zastosowanie |
|-------------|--------|--------------|
| Next.js | 16.x | Framework fullstack |
| React | 18.x | UI Framework |
| Vercel Postgres | - | Baza danych PostgreSQL |
| Tailwind CSS | 3.x | Styling |
| Recharts | 3.x | Wykresy i wizualizacje |
| Axios | 1.x | Klient HTTP |

## 3. Struktura Projektu

```
OrdApi/
├── ordap-vercel/                    # PRODUKCJA (Vercel)
│   ├── app/
│   │   ├── page.js                  # Dashboard główny
│   │   ├── layout.js                # Layout aplikacji
│   │   ├── globals.css              # Style globalne
│   │   ├── zamowienia/
│   │   │   ├── page.js              # Lista zamówień
│   │   │   └── [id]/page.js         # Szczegóły zamówienia
│   │   ├── agent/page.js            # AI Agent
│   │   ├── crm/page.js              # CRM
│   │   ├── wms/page.js              # WMS
│   │   ├── magazyny/page.js         # Magazyny
│   │   ├── login/page.js            # Logowanie
│   │   └── api/
│   │       ├── orders/
│   │       │   ├── route.js         # GET /api/orders
│   │       │   └── [id]/route.js    # GET /api/orders/:id
│   │       ├── sync/route.js        # GET/POST /api/sync
│   │       ├── sync-historical/route.js
│   │       ├── stats/route.js       # GET /api/stats
│   │       ├── channels/route.js    # GET /api/channels
│   │       ├── statuses/route.js    # GET /api/statuses
│   │       ├── agent/route.js       # POST /api/agent
│   │       ├── auth/
│   │       │   ├── login/route.js
│   │       │   └── logout/route.js
│   │       ├── init/route.js
│   │       └── debug/route.js
│   ├── lib/
│   │   ├── db.js                    # Vercel Postgres + funkcje DB
│   │   └── apilo.js                 # Integracja Apilo API
│   ├── package.json
│   └── .env.local                   # Zmienne lokalne (nie w repo)
├── backend/                         # Wersja dev (Express.js)
├── frontend/                        # Wersja dev (React+Vite)
├── claude.md                        # Ten plik
└── README.md
```

## 4. Baza Danych (Vercel Postgres)

### Tabela `orders`
```sql
CREATE TABLE orders (
  id VARCHAR(20) PRIMARY KEY,
  external_id VARCHAR(100),
  channel_label VARCHAR(255),
  channel_platform VARCHAR(100),
  ordered_at TIMESTAMP,
  updated_at TIMESTAMP,
  shipping_date TIMESTAMP,
  send_date_min TIMESTAMP,
  send_date_max TIMESTAMP,
  payment_status VARCHAR(20),
  delivery_status INTEGER,
  total_gross DECIMAL(10,2),
  total_net DECIMAL(10,2),
  currency VARCHAR(3),
  paid_amount DECIMAL(10,2),
  items JSONB,
  customer JSONB,
  shipping JSONB,
  invoice JSONB,
  payments JSONB,
  notes JSONB,
  is_invoice BOOLEAN DEFAULT false,
  is_canceled BOOLEAN DEFAULT false,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela `tokens`
```sql
CREATE TABLE tokens (
  id SERIAL PRIMARY KEY,
  access_token TEXT,
  refresh_token TEXT,
  expires_at BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela `sync_status`
```sql
CREATE TABLE sync_status (
  id SERIAL PRIMARY KEY,
  last_sync_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 5. API Endpoints

### Zamówienia
| Endpoint | Metoda | Parametry | Opis |
|----------|--------|-----------|------|
| `/api/orders` | GET | `page`, `perPage`, `search`, `channel`, `status` | Lista zamówień z paginacją |
| `/api/orders/[id]` | GET | - | Szczegóły zamówienia |

### Synchronizacja
| Endpoint | Metoda | Opis |
|----------|--------|------|
| `/api/sync` | GET/POST | Synchronizacja nowych zamówień |
| `/api/sync-historical` | POST | Synchronizacja historyczna |

### Dane pomocnicze
| Endpoint | Metoda | Opis |
|----------|--------|------|
| `/api/stats` | GET | Statystyki dla dashboardu |
| `/api/channels` | GET | Lista kanałów sprzedaży |
| `/api/statuses` | GET | Lista statusów zamówień |

### AI Agent
| Endpoint | Metoda | Opis |
|----------|--------|------|
| `/api/agent` | POST | Endpoint dla AI Agenta |

## 6. Model Danych (OrderDTO)

```typescript
interface OrderDTO {
  id: string;
  externalId: string | null;

  channel: {
    label: string;           // np. "Amazon DE Agnieszka"
    platform: string;        // np. "Amazon"
  };

  dates: {
    orderedAt: string;
    updatedAt: string;
    shippingDate: string | null;
    sendDateMin: string | null;
    sendDateMax: string | null;
  };

  status: {
    paymentStatus: 'PAID' | 'UNPAID';
    paymentStatusCode: number;
    deliveryStatus: number | null;
    isInvoice: boolean;
    isCanceled: boolean;
  };

  financials: {
    totalGross: number;
    totalNet: number;
    currency: string;
    paidAmount: number;
  };

  customer: {
    name: string;
    phone: string;
    email: string;
    street: string;
    city: string;
    zipCode: string;
    country: string;
    companyName: string;
    companyTaxNumber: string;
  } | null;

  shipping: { /* jak customer */ } | null;
  invoice: { /* jak customer */ } | null;

  payments: Array<{
    id: number;
    date: string | null;
    amount: number;
    currency: string;
    type: string;
    comment: string;
  }>;

  notes: Array<{
    type: number;
    comment: string;
    createdAt: string;
  }>;

  items: Array<{
    name: string;
    sku: string;
    ean: string;
    quantity: number;
    priceGross: number;
    priceNet: number;
    totalGross: number;
    image: string | null;
    isShipping: boolean;
    tax: number | null;
  }>;
}
```

## 7. Konfiguracja Apilo API

### Dane połączenia
- **Base URL:** `https://poom.apilo.com`
- **Limity:** 150 requestów/minutę

### Endpointy Apilo używane
| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | `/rest/auth/token/` | OAuth2 (refresh_token) |
| GET | `/rest/api/orders/` | Lista zamówień |
| GET | `/rest/api/orders/{id}/` | Szczegóły zamówienia |
| GET | `/rest/api/orders/platform/map/` | Mapa platform |
| GET | `/rest/api/orders/payment/map/` | Mapa płatności |

## 8. Funkcje AI Agenta (lib/db.js)

Agent ma dostęp do następujących funkcji statystycznych:

| Funkcja | Opis |
|---------|------|
| `getTodayStats()` | Statystyki z dzisiaj |
| `getYesterdayStats()` | Statystyki z wczoraj |
| `getLast7DaysStats()` | Statystyki z 7 dni |
| `getLast30DaysStats()` | Statystyki z 30 dni |
| `getThisMonthStats()` | Statystyki z bieżącego miesiąca |
| `getLastMonthStats()` | Statystyki z poprzedniego miesiąca |
| `getStatsByPlatformLast7Days()` | Podział na platformy (7 dni) |
| `getDailyStatsLast14Days()` | Dzienna sprzedaż (14 dni) |
| `getTopProductsLast30Days(limit)` | Top produkty (30 dni) |
| `getOverallStats()` | Ogólne statystyki |
| `getStatusDistribution()` | Rozkład statusów |
| `searchOrderForAgent(searchTerm)` | Wyszukiwanie zamówienia |

**Uwaga:** Wszystkie wartości są przeliczane na PLN (EUR × 4.35).

## 9. Zmienne Środowiskowe

### Vercel (Production)
```env
APILO_BASE_URL=https://poom.apilo.com
APILO_CLIENT_ID=4
APILO_CLIENT_SECRET=xxx
CRON_SECRET=xxx (opcjonalne)
# POSTGRES_URL - automatycznie przez Vercel Postgres
```

### Lokalne (.env.local)
```env
APILO_BASE_URL=https://poom.apilo.com
APILO_CLIENT_ID=4
APILO_CLIENT_SECRET=xxx
POSTGRES_URL=postgres://...
```

## 10. Deployment

Projekt jest hostowany na **Vercel** z automatycznym deploy.

### Vercel Cron (Synchronizacja)
Można skonfigurować Vercel Cron do automatycznej synchronizacji:
```json
// vercel.json
{
  "crons": [{
    "path": "/api/sync",
    "schedule": "*/10 * * * *"
  }]
}
```

## 11. Instrukcje dla Claude

### Przy modyfikacji kodu:
- **Główny kod produkcyjny** jest w `ordap-vercel/`
- **Nie modyfikuj** struktury bazy danych bez migracji
- **Testuj** zmiany lokalnie przed deploy

### Przy dodawaniu funkcji:
- Nowe strony: `ordap-vercel/app/nazwa/page.js`
- Nowe API: `ordap-vercel/app/api/nazwa/route.js`
- Funkcje DB: `ordap-vercel/lib/db.js`
- Integracja Apilo: `ordap-vercel/lib/apilo.js`

### Konwencje:
- Wszystkie daty w strefie czasowej `Europe/Warsaw`
- Waluta bazowa: PLN (EUR przeliczane × 4.35)
- Status płatności: `paymentStatus >= 2` = PAID

### Ważne pliki do ignorowania (nie commitować):
- `.env.local` — sekrety lokalne
- `node_modules/`
