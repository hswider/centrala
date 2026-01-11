OrdAp — Standalone Apilo Dashboard (Node.js + React)
1. Cel Projektu
Budowa lekkiej aplikacji "OrdAp" (One-Pager), która samodzielnie pobiera 10 najnowszych zamówień z systemu ERP Apilo, anonimizuje dane (usuwa PII) i wyświetla je na dashboardzie.
Zmiana architektury: Rezygnujemy z n8n. Cała logika ETL (Extract, Transform, Load) oraz harmonogramowanie zadań (Cron) są zaimplementowane bezpośrednio w backendzie Node.js.

2. Tech Stack
Backend
Runtime: Node.js
Framework: Express.js
Scheduler: node-cron (do cyklicznego pobierania danych co 10 min).
HTTP Client: axios (z obsługą interceptorów do odświeżania tokenów).
Baza Danych (MVP): lowdb (lekka baza plikowa JSON) lub po prostu plik data/orders.json + data/tokens.json.
Utilities: dotenv (zmienne środowiskowe).
Frontend
Framework: React 18 + Vite.
Styling: Tailwind CSS.
Komponenty: Prosta tabela z renderowaniem warunkowym statusów.

3. Architektura i Przepływ Danych
Inicjalizacja: Serwer startuje, wczytuje konfigurację i uruchamia Crona (*/10 * * * *).
Sync Service (Backend):
Sprawdza ważność Access Tokena (jeśli wygasł → używa Refresh Tokena → zapisuje nowe tokeny).
Pobiera słowniki (Mapy) z Apilo (cache'owane w pamięci).
Pobiera listę 10 ostatnich zamówień (/orders).
Dla każdego zamówienia pobiera szczegóły (/orders/{id}).
Mapuje dane do formatu OrderDTO (usuwając dane osobowe).
Zapisuje wynikową listę do db.json.
API Serving: Endpoint GET /api/orders serwuje dane bezpośrednio z db.json.
Frontend: Pobiera dane z API i wyświetla.

4. Konfiguracja Apilo (Source API)
Base URL: https://{twoja-instancja}.apilo.com (z APILO_BASE_URL)
Limity: 150 requestów / minutę. Należy stosować opóźnienia lub p-limit przy pobieraniu szczegółów.
Wymagane Zmienne Środowiskowe (.env)
Fragment kodu
PORT=3001
APILO_BASE_URL=https://...
APILO_CLIENT_ID=...
APILO_CLIENT_SECRET=...
# Tokeny startowe (aplikacja będzie je nadpisywać w pliku tokens.json)
APILO_INITIAL_AUTH_CODE=... 

Kluczowe Endpointy
Metoda
Endpoint
Zastosowanie
POST
/rest/auth/token/
Logowanie / Odświeżanie tokena (Grant: authorization_code lub refresh_token)
GET
/rest/api/orders/
Lista: ?limit=10&sort=updatedAtDesc
GET
/rest/api/orders/{id}/
Szczegóły (Items, Payments)
GET
/rest/api/orders/platform/map/
Nazwy platform (np. Allegro)
GET
/rest/api/orders/payment/map/
Nazwy metod płatności


5. Logika Backendu (Instrukcje dla Claude)
A. Obsługa Autoryzacji (Token Management)
To krytyczny element. Aplikacja musi być "samoobsługowa".
Stwórz plik tokens.json do przechowywania aktualnych accessToken i refreshToken.
Przy każdym zapytaniu do Apilo sprawdź, czy nie otrzymano 401 Unauthorized.
Mechanizm Retry:
Jeśli 401 → Wywołaj /rest/auth/token/ z grantType: refresh_token.
Zapisz nowe tokeny do tokens.json.
Ponów oryginalne zapytanie.
Jeśli brak refreshToken (pierwsze uruchomienie), użyj APILO_INITIAL_AUTH_CODE.
B. Serwis Synchronizacji (syncService.js)
Funkcja runSync() powinna:
Pobrać mapowania (Platformy, Płatności) – można to robić raz na start serwera.
Pobrać listę zamówień (limit 10).
Użyć Promise.all z limitem współbieżności (np. max 5 requestów naraz), aby pobrać szczegóły każdego zamówienia (endpoint /orders/{id}).
Transformacja danych (Mapper): Przekształcić surowy JSON z Apilo na czysty OrderDTO.

6. Model Danych (OrderDTO)
Format danych, który backend zwraca do frontendu (oczyszczony z PII).
TypeScript
interface OrderDTO {
  id: string;                // Apilo ID
  externalId: string | null; // ID z platformy (np. Allegro ID)
  
  channel: {
    label: string;           // np. "Allegro - Konto X"
    platform: string;        // np. "Allegro"
  };

  dates: {
    orderedAt: string;       // ISO Date
    updatedAt: string;
    shippingDate: string | null;
  };

  status: {
    paymentStatus: 'PAID' | 'UNPAID'; // Wyliczone na podstawie paymentStatus (1=Paid)
    deliveryStatus: string | null;    // Opcjonalne
  };

  financials: {
    totalGross: number;      // Wartość zamówienia
    currency: string;
    paidAmount: number;
  };

  items: Array<{
    name: string;
    sku: string;
    quantity: number;
    priceGross: number;
    totalGross: number;
    image: string | null;
    isShipping: boolean;     // true jeśli type == 2 (Wysyłka)
  }>;
}


7. Wymagania Frontendowe
Widok: Single Page Application.
Auto-refresh: Frontend powinien odpytywać backend (GET /api/orders) co np. 60 sekund, aby pokazać świeże dane z pliku JSON.
UI/UX:
Czysta tabela.
Kolumny: Zdjęcie | Nazwa/SKU | Ilość | Cena | Suma.
Wiersz nagłówkowy zamówienia: Logo kanału sprzedaży, status płatności (Badge), Data.
Jeśli pozycja to "Wysyłka" (isShipping: true), wyróżnij ją wizualnie (np. szare tło lub ikona ciężarówki).

8. Instrukcja Generowania Kodu (Prompt Steps)
Proszę o wygenerowanie kodu w następujących krokach:
Krok 1: Backend Setup
Struktura katalogów.
package.json (express, axios, node-cron, lowdb/fs, dotenv, cors).
services/apiloAuth.js – moduł obsługujący logikę tokenów i axios interceptors.
services/apiloSync.js – główna logika pobierania i mapowania.
server.js – entry point z harmonogramem cron i endpointem API.
Krok 2: Frontend Setup
Komponent App.jsx pobierający dane.
Komponent OrderList.jsx i OrderItem.jsx.
Style Tailwind dla tabeli.
Krok 3: Instrukcja Uruchomienia
Jak wypełnić .env.
Jak uruchomić serwer deweloperski (concurrently backend + frontend).


