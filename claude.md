# Centrala POOM — Dashboard Zamówień Apilo

## 1. Opis Projektu

**Centrala POOM** to wewnętrzna aplikacja dashboardowa do monitorowania zamówień z systemu ERP Apilo (instancja: poom.apilo.com). Aplikacja automatycznie synchronizuje 10 najnowszych zamówień co 10 minut i wyświetla je w przejrzystym interfejsie webowym.

### Kluczowe funkcje:
- Automatyczna synchronizacja zamówień z Apilo API
- Anonimizacja danych klientów (usuwanie PII)
- Podgląd statusów płatności i dostawy
- Responsywny interfejs z auto-odświeżaniem

## 2. Tech Stack

### Backend
| Technologia | Wersja | Zastosowanie |
|-------------|--------|--------------|
| Node.js | 18+ | Runtime |
| Express.js | 4.x | Framework HTTP |
| Axios | 1.x | Klient HTTP z interceptorami |
| node-cron | 3.x | Harmonogram synchronizacji |
| dotenv | 16.x | Zmienne środowiskowe |

### Frontend
| Technologia | Wersja | Zastosowanie |
|-------------|--------|--------------|
| React | 18.x | UI Framework |
| Vite | 5.x | Build tool |
| Tailwind CSS | 3.x | Styling |

## 3. Struktura Projektu

```
OrdApi/
├── backend/
│   ├── server.js                 # Entry point, Express + Cron
│   ├── services/
│   │   ├── apiloAuth.js          # Obsługa tokenów OAuth2
│   │   └── apiloSync.js          # Synchronizacja zamówień
│   ├── data/
│   │   ├── orders.json           # Cache zamówień (generowany)
│   │   └── tokens.json           # Tokeny API (generowany)
│   ├── package.json
│   └── .env                      # Konfiguracja (nie w repo!)
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Główny komponent
│   │   ├── main.jsx              # Entry point React
│   │   ├── index.css             # Style Tailwind
│   │   └── components/
│   │       ├── OrderList.jsx     # Lista zamówień
│   │       └── OrderItem.jsx     # Pojedyncze zamówienie
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── README.md
└── claude.md                     # Ten plik
```

## 4. Konfiguracja Apilo API

### Dane połączenia
- **Base URL:** `https://poom.apilo.com`
- **Limity:** 150 requestów/minutę

### Zmienne środowiskowe (`backend/.env`)
```env
PORT=3001
APILO_BASE_URL=https://poom.apilo.com
APILO_CLIENT_ID=4
APILO_CLIENT_SECRET=<secret>
APILO_INITIAL_AUTH_CODE=<auth_code>
```

### Endpointy Apilo używane w aplikacji

| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | `/rest/auth/token/` | Autoryzacja OAuth2 (authorization_code / refresh_token) |
| GET | `/rest/api/orders/?limit=10&sort=updatedAtDesc` | Lista zamówień |
| GET | `/rest/api/orders/platform/map/` | Mapa platform sprzedaży |
| GET | `/rest/api/orders/payment/map/` | Mapa metod płatności |

## 5. API Backendu (Centrala POOM)

| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/orders` | Zwraca listę zamówień z cache |
| POST | `/api/sync` | Wymusza ręczną synchronizację |
| GET | `/api/health` | Health check |

## 6. Model Danych (OrderDTO)

Format danych zwracanych przez backend (oczyszczony z danych osobowych):

```typescript
interface OrderDTO {
  id: string;                      // Apilo ID
  externalId: string | null;       // ID z platformy (np. Allegro)

  channel: {
    label: string;                 // np. "Allegro - Konto POOM"
    platform: string;              // np. "Allegro"
  };

  dates: {
    orderedAt: string;             // ISO Date
    updatedAt: string;
    shippingDate: string | null;
  };

  status: {
    paymentStatus: 'PAID' | 'UNPAID';
    deliveryStatus: string | null;
  };

  financials: {
    totalGross: number;
    currency: string;              // np. "PLN"
    paidAmount: number;
  };

  items: Array<{
    name: string;
    sku: string;
    quantity: number;
    priceGross: number;
    totalGross: number;
    image: string | null;
    isShipping: boolean;           // true = pozycja wysyłki
  }>;
}
```

## 7. Logika Autoryzacji (apiloAuth.js)

System automatycznie zarządza tokenami OAuth2:

1. **Sprawdzenie ważności** — przed każdym requestem sprawdza `expiresAt`
2. **Refresh Token** — jeśli access token wygasł, użyj refresh token
3. **Authorization Code** — jeśli refresh token nie działa, użyj `APILO_INITIAL_AUTH_CODE`
4. **Retry na 401** — interceptor automatycznie odświeża token i ponawia request

Tokeny są przechowywane w `backend/data/tokens.json`.

## 8. Harmonogram Synchronizacji

- **Cron:** `*/10 * * * *` (co 10 minut)
- **Przy starcie:** automatyczna synchronizacja inicjalna
- **Ręcznie:** `POST /api/sync`

## 9. Uruchomienie

### Wymagania
- Node.js 18+
- npm

### Instalacja
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Start
```bash
# Terminal 1 - Backend
cd backend && node server.js

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### Adresy
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 10. Instrukcje dla Claude

### Przy modyfikacji kodu:
- **Nie zmieniaj** struktury autoryzacji bez potrzeby — działa stabilnie
- **Zachowaj** format OrderDTO — frontend od niego zależy
- **Testuj** synchronizację po zmianach w `apiloSync.js`

### Przy dodawaniu funkcji:
- Nowe endpointy dodawaj w `server.js`
- Nowe komponenty UI w `frontend/src/components/`
- Logikę biznesową w `backend/services/`

### Ważne pliki do ignorowania:
- `backend/.env` — sekrety
- `backend/data/tokens.json` — tokeny OAuth
- `backend/data/orders.json` — cache danych
- `node_modules/` — zależności
