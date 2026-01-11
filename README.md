# Centrala POOM — Dashboard Zamówień Apilo

Wewnętrzna aplikacja do monitorowania zamówień z systemu ERP Apilo.

## Tech Stack

- **Backend:** Node.js + Express.js + node-cron
- **Frontend:** React 18 + Vite + Tailwind CSS
- **API:** Apilo REST API (poom.apilo.com)

## Instalacja

### 1. Sklonuj repozytorium

```bash
git clone https://github.com/TWOJ_USERNAME/OrdApi.git
cd OrdApi
```

### 2. Zainstaluj zależności

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 3. Konfiguracja

Utwórz plik `backend/.env`:

```env
PORT=3001
APILO_BASE_URL=https://poom.apilo.com
APILO_CLIENT_ID=4
APILO_CLIENT_SECRET=<twoj_secret>
APILO_INITIAL_AUTH_CODE=<twoj_auth_code>
```

## Uruchomienie

### Backend (Terminal 1)

```bash
cd backend
node server.js
```

Serwer uruchomi się na `http://localhost:3001`

### Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

Aplikacja będzie dostępna na `http://localhost:5173`

## Struktura projektu

```
OrdApi/
├── backend/
│   ├── server.js              # Entry point + Cron
│   ├── services/
│   │   ├── apiloAuth.js       # Obsługa tokenów OAuth2
│   │   └── apiloSync.js       # Synchronizacja zamówień
│   ├── data/                  # Generowane pliki (cache)
│   └── .env                   # Konfiguracja (nie w repo)
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/
│   │       ├── OrderList.jsx
│   │       └── OrderItem.jsx
│   └── ...
├── claude.md                  # Dokumentacja dla Claude AI
└── README.md
```

## API Endpoints

| Endpoint | Metoda | Opis |
|----------|--------|------|
| `/api/orders` | GET | Lista 10 ostatnich zamówień |
| `/api/sync` | POST | Wymusza synchronizację |
| `/api/health` | GET | Health check |

## Funkcje

- Automatyczna synchronizacja co 10 minut (cron)
- Automatyczne odświeżanie tokenów OAuth2
- Anonimizacja danych klientów (bez PII)
- Podgląd statusów płatności

## Uwagi

- Plik `.env` zawiera klucze API — nie commituj go
- Tokeny są automatycznie odświeżane
- Szczegółowa dokumentacja w `claude.md`
