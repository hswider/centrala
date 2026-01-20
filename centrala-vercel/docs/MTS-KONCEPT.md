# MTS (Make-To-Stock) - Koncepcja Planowania Produkcji

Data: 2025-01-20

## 1. Cel Modulu

Automatyczne generowanie planow produkcji na magazyn na podstawie:
- Aktualnych stanow magazynowych (tabela `inventory`)
- Trendow sprzedazowych (analiza `orders.items`)

Uruchamianie: raz w tygodniu (np. czwartek) lub na zadanie.

---

## 2. Zrodla Danych

### 2.1 Stany Magazynowe (inventory)

```sql
-- Istniejaca tabela inventory
SELECT sku, nazwa, stan, kategoria
FROM inventory
WHERE kategoria = 'gotowe'
```

**Kolumny do dodania:**
- `min_stock` - minimalny stan magazynowy
- `max_stock` - maksymalny stan (opcjonalnie)
- `lead_time_days` - czas produkcji w dniach

### 2.2 Trendy Sprzedazy (orders)

Istniejaca funkcja `getTopProductsLast30Days()` w `lib/db.js`:

```sql
SELECT
  item->>'sku' as sku,
  item->>'name' as product_name,
  SUM((item->>'quantity')::int) as total_quantity,
  COUNT(DISTINCT id) as order_count
FROM orders, jsonb_array_elements(items) as item
WHERE ordered_at >= CURRENT_DATE - INTERVAL '30 days'
  AND is_canceled = false
  AND (item->>'isShipping')::boolean = false
GROUP BY item->>'sku', item->>'name'
ORDER BY total_quantity DESC
```

---

## 3. Algorytm Planowania

### 3.1 Wzor na Zapotrzebowanie

```
srednia_dzienna = total_quantity / liczba_dni
zapotrzebowanie = (srednia_dzienna * dni_do_uzupelnienia) - aktualny_stan
do_produkcji = zapotrzebowanie * wspolczynnik_bezpieczenstwa
```

### 3.2 Parametry

| Parametr | Domyslna wartosc | Opis |
|----------|------------------|------|
| `analysisPeriod` | 14 dni | Okres analizy trendow |
| `planningHorizon` | 7 dni | Na ile dni planujemy |
| `safetyFactor` | 1.2 | Wspolczynnik bezpieczenstwa (20% zapasu) |
| `minDeficit` | 5 | Minimalny deficyt do uwzglednienia |

### 3.3 Priorytetyzacja

1. **Krytyczny** (czerwony): deficyt > 50% sredniej tygodniowej
2. **Wysoki** (zolty): deficyt > 0
3. **Normalny** (zielony): stan >= zapotrzebowanie

---

## 4. Struktura Bazy Danych

### 4.1 Nowa Tabela: production_plans

```sql
CREATE TABLE production_plans (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  plan_date DATE NOT NULL,
  plan_week INTEGER, -- numer tygodnia ISO
  status VARCHAR(20) DEFAULT 'draft',
  -- draft, approved, in_progress, completed, cancelled
  items JSONB NOT NULL,
  -- [{sku, nazwa, current_stock, avg_daily, deficit, to_produce, priority}]
  analysis_period_days INTEGER DEFAULT 14,
  planning_horizon_days INTEGER DEFAULT 7,
  safety_factor DECIMAL(3,2) DEFAULT 1.20,
  created_by INTEGER REFERENCES users(id),
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  notes TEXT
);

CREATE INDEX idx_production_plans_date ON production_plans(plan_date);
CREATE INDEX idx_production_plans_status ON production_plans(status);
```

### 4.2 Migracja Tabeli inventory

```sql
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS max_stock INTEGER;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS lead_time_days INTEGER DEFAULT 1;
```

---

## 5. API Endpoints

### 5.1 Analiza Zapotrzebowania

```
GET /api/mts/analysis?days=14
```

Response:
```json
{
  "success": true,
  "analysis": {
    "period_days": 14,
    "generated_at": "2025-01-20T10:00:00Z",
    "products": [
      {
        "sku": "LEG-XXL-GR",
        "nazwa": "Legowisko XXL Grafitowe",
        "current_stock": 3,
        "total_sold": 84,
        "avg_daily": 6.0,
        "weekly_demand": 42,
        "deficit": -39,
        "priority": "critical"
      }
    ]
  }
}
```

### 5.2 Generowanie Planu

```
POST /api/mts/generate
```

Body:
```json
{
  "analysisPeriod": 14,
  "planningHorizon": 7,
  "safetyFactor": 1.2,
  "minDeficit": 5
}
```

### 5.3 Lista Planow

```
GET /api/mts/plans?status=draft&page=1
```

### 5.4 Szczegoly Planu

```
GET /api/mts/plans/:id
```

### 5.5 Aktualizacja Planu

```
PUT /api/mts/plans/:id
```

Body:
```json
{
  "status": "approved",
  "items": [...],
  "notes": "Zatwierdzono z modyfikacjami"
}
```

---

## 6. Funkcje w lib/db.js

```javascript
// Analiza zapotrzebowania MTS
export async function getMTSAnalysis(days = 14, planningDays = 7) {
  // 1. Pobierz trendy sprzedazy z ostatnich X dni
  // 2. Pobierz stany inventory (kategoria = 'gotowe')
  // 3. Matchuj po SKU (normalizacja!)
  // 4. Oblicz srednia dzienna, deficyt, priorytet
  // return { products: [...], summary: {...} }
}

// Generowanie planu produkcji
export async function generateProductionPlan(userId, options = {}) {
  // 1. Wywolaj getMTSAnalysis()
  // 2. Filtruj produkty z deficytem > minDeficit
  // 3. Oblicz ilosci do produkcji (z safety factor)
  // 4. Zapisz plan do production_plans
  // return { planId, items: [...] }
}

// Pobierz plany produkcji
export async function getProductionPlans(page = 1, perPage = 10, status = null) {
  // return { plans: [...], pagination: {...} }
}

// Pobierz szczegoly planu
export async function getProductionPlanById(id) {
  // return plan
}

// Aktualizuj plan
export async function updateProductionPlan(id, data, userId) {
  // Loguj zmiany statusu
  // return updated plan
}
```

---

## 7. Widok UI (app/mts/page.js)

### 7.1 Layout

```
+------------------------------------------------------------------+
|  MTS - Make to Stock                              [Generuj Plan] |
+------------------------------------------------------------------+
|                                                                  |
|  Parametry analizy:                                              |
|  Okres: [7d] [14d] [30d]   Horyzont: [7 dni]   Zapas: [20%]     |
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
|  ANALIZA ZAPOTRZEBOWANIA                          Odswież       |
|  +------------------------------------------------------------+  |
|  | SKU        | Nazwa           | Stan | Sr/d | Deficyt | Pri |  |
|  +------------------------------------------------------------+  |
|  | LEG-XXL-GR | Legowisko XXL   |   3  |  6.0 |   -39   | !!! |  |
|  | PIK-STD-BL | Pikowka std     |   8  |  3.5 |   -16   |  !! |  |
|  | LEG-M-SZ   | Legowisko M     |  25  |  2.0 |    +11  |  ok |  |
|  +------------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
|  HISTORIA PLANOW                                                 |
|  +------------------------------------------------------------+  |
|  | #125 | 2025-01-23 | 12 produktow | Draft      | [Edytuj]   |  |
|  | #124 | 2025-01-16 | 15 produktow | Zrealizowany            |  |
|  +------------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

### 7.2 Statusy Planow

| Status | Kolor | Opis |
|--------|-------|------|
| `draft` | Szary | Wygenerowany, do edycji |
| `approved` | Niebieski | Zatwierdzony do realizacji |
| `in_progress` | Zolty | W trakcie produkcji |
| `completed` | Zielony | Zrealizowany |
| `cancelled` | Czerwony | Anulowany |

---

## 8. Cron Job (Automatyczne Generowanie)

### 8.1 Konfiguracja vercel.json

```json
{
  "crons": [
    {
      "path": "/api/mts/auto-generate",
      "schedule": "0 8 * * 4"
    }
  ]
}
```

Opis: Kazdy czwartek o 8:00 UTC.

### 8.2 Endpoint Auto-Generate

```javascript
// app/api/mts/auto-generate/route.js
export async function GET(request) {
  // Weryfikacja CRON_SECRET
  // Generuj plan z domyslnymi parametrami
  // Wyslij powiadomienie (opcjonalnie)
}
```

---

## 9. Wyzwania i Uwagi

### 9.1 Matchowanie SKU

Problem: SKU w zamowieniach moze miec inny format niz w inventory.

Rozwiazanie:
- Normalizacja SKU (uppercase, trim, usun spacje)
- Tabela mapowania SKU (opcjonalnie)

```javascript
function normalizeSku(sku) {
  return (sku || '').toUpperCase().trim().replace(/\s+/g, '-');
}
```

### 9.2 Produkty Bez Matchingu

Co robic gdy SKU z zamowien nie istnieje w inventory?
- Raportowac jako "brak w magazynie"
- Sugerowac dodanie do inventory

### 9.3 Sezonowosc

Opcjonalnie: wagi dla roznych okresow
- Ostatni tydzien: waga 2.0
- 2-4 tygodnie temu: waga 1.0

### 9.4 Receptury (Przyszlosc)

Przy planowaniu gotowych produktow:
- Sprawdzic dostepnosc skladnikow (tabela `recipes`)
- Alerty gdy brakuje surowcow

---

## 10. Kolejnosc Implementacji

### Faza 1: MVP
1. [ ] Migracja inventory (min_stock, lead_time)
2. [ ] Funkcja getMTSAnalysis() w db.js
3. [ ] API GET /api/mts/analysis
4. [ ] Podstawowy widok strony MTS

### Faza 2: Plany
5. [ ] Tabela production_plans
6. [ ] API POST /api/mts/generate
7. [ ] API GET/PUT /api/mts/plans
8. [ ] Widok listy planow i edycji

### Faza 3: Automatyzacja
9. [ ] Cron job czwartkowy
10. [ ] Powiadomienia (email/slack)
11. [ ] Dashboard z wykresami trendow

### Faza 4: Zaawansowane
12. [ ] Integracja z recepturami
13. [ ] Sezonowosc i wagi
14. [ ] Eksport do PDF/Excel

---

## 11. Przykladowe Zapytanie SQL

Polaczenie trendow ze stanami:

```sql
WITH sales_trends AS (
  SELECT
    item->>'sku' as sku,
    item->>'name' as nazwa,
    SUM((item->>'quantity')::int) as total_sold,
    COUNT(DISTINCT o.id) as order_count
  FROM orders o, jsonb_array_elements(items) as item
  WHERE ordered_at >= CURRENT_DATE - INTERVAL '14 days'
    AND is_canceled = false
    AND (item->>'isShipping')::boolean = false
  GROUP BY item->>'sku', item->>'name'
),
inventory_stock AS (
  SELECT sku, nazwa, stan, min_stock, lead_time_days
  FROM inventory
  WHERE kategoria = 'gotowe'
)
SELECT
  COALESCE(s.sku, i.sku) as sku,
  COALESCE(s.nazwa, i.nazwa) as nazwa,
  COALESCE(i.stan, 0) as current_stock,
  COALESCE(s.total_sold, 0) as total_sold,
  ROUND(COALESCE(s.total_sold, 0) / 14.0, 2) as avg_daily,
  ROUND(COALESCE(s.total_sold, 0) / 14.0 * 7, 0) as weekly_demand,
  COALESCE(i.stan, 0) - ROUND(COALESCE(s.total_sold, 0) / 14.0 * 7, 0) as deficit
FROM sales_trends s
FULL OUTER JOIN inventory_stock i ON UPPER(s.sku) = UPPER(i.sku)
WHERE COALESCE(s.total_sold, 0) > 0 OR COALESCE(i.stan, 0) > 0
ORDER BY deficit ASC;
```
