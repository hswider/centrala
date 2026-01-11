# OrdAp - Apilo Dashboard (Vercel)

Dashboard zamowien z systemu Apilo, zdeployowany na Vercel z baza danych Postgres.

## Deployment na Vercel

### 1. Przygotowanie repozytorium

```bash
cd ordap-vercel
git init
git add .
git commit -m "Initial commit"
```

Wrzuc na GitHub/GitLab/Bitbucket.

### 2. Import do Vercel

1. Wejdz na https://vercel.com
2. Kliknij "Add New Project"
3. Zaimportuj repozytorium z GitHub
4. Vercel automatycznie wykryje Next.js

### 3. Utworz baze danych Vercel Postgres

1. W dashboardzie Vercel, wejdz do projektu
2. Kliknij "Storage" w menu
3. Kliknij "Create Database" -> "Postgres"
4. Wybierz region (najlepiej blisko Twojej lokalizacji)
5. Vercel automatycznie doda zmienne srodowiskowe do projektu

### 4. Dodaj zmienne srodowiskowe

W Settings -> Environment Variables dodaj:

```
APILO_BASE_URL=https://poom.apilo.com
APILO_CLIENT_ID=4
APILO_CLIENT_SECRET=f5ddd11a-7828-5ce9-8b6c-19b4add6bb48
CRON_SECRET=wygeneruj-losowy-klucz
```

### 5. Zainicjalizuj baze danych i tokeny

Po pierwszym deployu, wywolaj endpoint init z tokenami:

```bash
curl -X POST https://twoja-aplikacja.vercel.app/api/init \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "TWOJ_ACCESS_TOKEN",
    "refreshToken": "TWOJ_REFRESH_TOKEN",
    "expiresAt": 1769932789000
  }'
```

Tokeny mozesz wziac z pliku `backend/data/tokens.json` z lokalnej wersji.

### 6. Vercel Cron

Cron jest juz skonfigurowany w `vercel.json` - synchronizacja co 10 minut.
**Uwaga:** Vercel Cron wymaga planu Pro lub Enterprise.

Na darmowym planie mozesz uzyc zewnetrznego crona (np. cron-job.org) do wywolywania:
```
GET https://twoja-aplikacja.vercel.app/api/sync
```

## Lokalne testowanie

```bash
npm run dev
```

Aplikacja wymaga polaczenia z Vercel Postgres. Do lokalnego testowania:

1. Zainstaluj Vercel CLI: `npm i -g vercel`
2. Polacz z projektem: `vercel link`
3. Pobierz zmienne: `vercel env pull .env.local`
4. Uruchom: `npm run dev`

## Struktura

```
ordap-vercel/
├── app/
│   ├── api/
│   │   ├── orders/route.js   # GET /api/orders
│   │   ├── sync/route.js     # GET|POST /api/sync
│   │   └── init/route.js     # POST /api/init
│   ├── globals.css
│   ├── layout.js
│   └── page.js
├── components/
│   ├── OrderList.js
│   └── OrderItem.js
├── lib/
│   ├── apilo.js              # Klient API Apilo
│   └── db.js                 # Operacje na bazie danych
├── vercel.json               # Konfiguracja Vercel + Cron
└── package.json
```
