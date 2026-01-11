# Centrala POOM — Dashboard Zamówień Apilo

**Produkcja:** https://centrala-poom.vercel.app/

Wewnętrzna aplikacja do zarządzania zamówieniami z systemu ERP Apilo.

## Tech Stack

- **Framework:** Next.js 16
- **Baza danych:** Vercel Postgres
- **Styling:** Tailwind CSS
- **Wykresy:** Recharts
- **API:** Apilo REST API (poom.apilo.com)

## Funkcje

- Dashboard ze statystykami sprzedaży
- Wykresy: sprzedaż dzienna, podział na platformy
- Lista zamówień z wyszukiwarką i filtrami
- Szczegóły zamówienia (dane klienta, produkty, płatności)
- Automatyczna synchronizacja z Apilo
- AI Agent do zapytań o statystyki
- Obsługa wielu platform: Amazon, Allegro, Shopify, Kaufland, eBay, Cdiscount

## Struktura projektu

```
OrdApi/
├── ordap-vercel/              # Wersja produkcyjna (Vercel)
│   ├── app/
│   │   ├── page.js            # Dashboard
│   │   ├── zamowienia/        # Lista i szczegóły zamówień
│   │   ├── agent/             # AI Agent
│   │   ├── crm/               # CRM
│   │   ├── wms/               # Magazyny
│   │   ├── login/             # Logowanie
│   │   └── api/               # API Routes
│   │       ├── orders/        # Zamówienia
│   │       ├── sync/          # Synchronizacja
│   │       ├── stats/         # Statystyki
│   │       └── auth/          # Autoryzacja
│   └── lib/
│       ├── db.js              # Vercel Postgres
│       └── apilo.js           # Integracja Apilo API
├── backend/                   # Wersja lokalna (dev)
├── frontend/                  # Wersja lokalna (dev)
├── claude.md                  # Dokumentacja dla Claude AI
└── README.md
```

## API Endpoints

| Endpoint | Metoda | Opis |
|----------|--------|------|
| `/api/orders` | GET | Lista zamówień (paginacja, filtry) |
| `/api/orders/[id]` | GET | Szczegóły zamówienia |
| `/api/sync` | GET/POST | Synchronizacja z Apilo |
| `/api/stats` | GET | Statystyki dashboard |
| `/api/channels` | GET | Lista kanałów sprzedaży |
| `/api/statuses` | GET | Lista statusów |
| `/api/agent` | POST | AI Agent |

## Deployment (Vercel)

Projekt jest wdrożony na Vercel z automatycznym deploy z GitHub.

### Zmienne środowiskowe (Vercel Dashboard)

```
APILO_BASE_URL=https://poom.apilo.com
APILO_CLIENT_ID=xxx
APILO_CLIENT_SECRET=xxx
POSTGRES_URL=xxx (automatycznie przez Vercel Postgres)
```

## Rozwój lokalny

```bash
cd ordap-vercel
npm install
npm run dev
```

Aplikacja będzie dostępna na `http://localhost:3000`

## Dokumentacja

Szczegółowa dokumentacja techniczna w pliku `claude.md`.
