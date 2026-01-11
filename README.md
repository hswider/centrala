# OrdApi - Apilo Dashboard

Lekka aplikacja do wyświetlania zamówień z systemu ERP Apilo.

## Tech Stack

- **Backend:** Node.js + Express.js
- **Frontend:** React 18 + Vite + Tailwind CSS
- **API:** Apilo REST API

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
APILO_CLIENT_SECRET=f5ddd11a-7828-5ce9-8b6c-19b4add6bb48
APILO_INITIAL_AUTH_CODE=53913fd1-dca3-55ab-89cc-136b7a1f0b3a
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
│   ├── server.js              # Entry point
│   ├── services/
│   │   ├── apiloAuth.js       # Obsługa tokenów Apilo
│   │   └── apiloSync.js       # Synchronizacja zamówień
│   └── .env                   # Konfiguracja (nie w repo)
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/
│   │       ├── OrderList.jsx
│   │       └── OrderItem.jsx
│   └── ...
└── README.md
```

## API Endpoints

| Endpoint | Opis |
|----------|------|
| `GET /api/orders` | Lista 10 ostatnich zamówień |

## Uwagi

- Plik `.env` zawiera klucze API - nie commituj go do repozytorium
- Tokeny są automatycznie odświeżane przez backend
- Dane synchronizują się co 10 minut (cron)
