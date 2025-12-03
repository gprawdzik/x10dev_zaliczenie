# API Endpoint Implementation Plan: Activities

## 1. Przegląd punktów końcowych

Ten plan obejmuje implementację dwóch powiązanych punktów końcowych REST API:

1. **List activities** – `GET /api/activities` – zwraca listę aktywności użytkownika z opcjonalnym filtrowaniem, paginacją i sortowaniem.
2. **Generate activities** – `POST /api/activities-generate` – symuluje i zapisuje 100 aktywności użytkownika w bazie danych na podstawie zadanych (opcjonalnych) parametrów.

## 2. Szczegóły żądania

### 2.1 List activities – `GET /api/activities`

| Element | Wartość |
|---------|---------|
| Metoda HTTP | `GET` |
| URL | `/api/activities` |
| Query params |
| • `from` (ISO 8601, opc.) – data ≥ `start_date` |
| • `to` (ISO 8601, opc.) – data ≤ `start_date` |
| • `sport_type` (string, opc.) – dokładne dopasowanie do kolumny `sport_type` |
| • `type` (string, opc.) – dokładne dopasowanie do kolumny `type` |
| • `page` (int ≥ 1, domyślnie 1) |
| • `limit` (int 1-100, domyślnie 20) |
| • `sort_by` (`start_date`, `distance`, `moving_time`, domyślnie `start_date`) |
| • `sort_dir` (`asc`\|`desc`, domyślnie `desc`) |

Brak body.

### 2.2 Generate activities – `POST /api/activities-generate`

| Element | Wartość |
|---------|---------|
| Metoda HTTP | `POST` |
| URL | `/api/activities-generate` |
| Body (JSON) opcjonalne |
| • `primary_sports` – string[] dozwolonych dyscyplin |
| • `distribution` – obiekt `{ primary:number; secondary:number; tertiary:number; quaternary:number }` (sum≈1) |
| • `timezone` – identyfikator TZ IANA |

## 3. Wykorzystywane typy

Z pliku `src/types.ts`:

- `ActivityDto` (rekord w tabeli `activities`)
- `GenerateActivitiesRequest` / `GenerateActivitiesResponse`

Typy dodatkowe do paginacji:

```ts
export type Paginated<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
};
```

## 4. Szczegóły odpowiedzi

### 4.1 `GET /api/activities`

- **200 OK** – `Paginated<ActivityDto>`
- **401 Unauthorized** – `ErrorDto`

### 4.2 `POST /api/activities-generate`

- **201 Created** – `{ created_count: number }`
- **401 Unauthorized**, **422 Unprocessable Entity**, **500 Internal Server Error** – `ErrorDto`

## 5. Przepływ danych

1. Klient wysyła żądanie HTTP do punktu końcowego.
2. Endpoint w Astro (Server Endpoint) weryfikuje token Supabase (middleware `requireAuth`).
3. Dla **GET**:
   1. Budujemy zapytanie SQL z filtrami / sortowaniem / paginacją w service `activitiesService.list()`.
   2. Supabase zwraca dane; mapujemy do `ActivityDto` i `Paginated`.
4. Dla **POST**:
   1. Walidujemy body (Zod).
   2. Service `activitiesService.generate()` losuje 100 aktywności (algorytm opisany w PRD) i wykonuje batch insert.
   3. Zwracamy liczbę utworzonych rekordów.

## 6. Względy bezpieczeństwa

- **Uwierzytelnienie** – Supabase JWT; middleware odrzuca żądania bez ważnego tokena (401).
- **Autoryzacja** – RLS w bazie: `activities.user_id = auth.uid()`.
- **Walidacja** – Zod na wejściu; dodatkowe ograniczenia (limit ≤ 100, poprawny TZ).
- **Ochrona przed nadmiarem danych** – limit `limit` ≤ 100; paginacja.
- **SQL injection** – korzystamy z buildera Supabase i zapewniamy bindowanie parametrów.

## 7. Obsługa błędów

| Kod | Scenariusz | Odpowiedź |
|-----|------------|-----------|
| 400 | Walidacja query/body nie powiodła się | `ErrorDto { code:"VALIDATION_ERROR" }` |
| 401 | Brak / niepoprawny token | `ErrorDto { code:"UNAUTHORIZED" }` |
| 422 | Błędne parametry `distribution` lub `primary_sports` | `ErrorDto { code:"UNPROCESSABLE_ENTITY" }` |
| 500 | Błąd bazy lub nieoczekiwany wyjątek | `ErrorDto { code:"INTERNAL_ERROR" }` |

Logowanie błędów: konsola + monitoring (np. Sentry w Astro integrations), opcjonalnie tabela `error_logs`.

## 8. Rozważania dotyczące wydajności

- Indeks `idx_activities_user_start_date` zapewnia szybkie filtrowanie po użytkowniku i dacie.
- Batch insert w `generate()` (jedno zapytanie) minimalizuje round-tripy.
- Paginated query z `range()` Supabase unika pobierania całej tabeli.
- Opcjonalna materialized view dla agregacji rocznych (poza zakresem tego PR).

## 9. Etapy wdrożenia

1. **Utwórz walidatory Zod** w `src/validators/activity.ts`:
   - `listActivitiesQuerySchema`
   - `generateActivitiesBodySchema`
2. **Middleware `requireAuth`** (jeśli brak) w `src/middleware/requireAuth.ts`.
3. **Service `activitiesService`** w `src/services/activities.ts`:
   - `list(userId, params)` – zwraca `Paginated<ActivityDto>`
   - `generate(userId, overrides)` – inserty batch.
4. **Endpointy Astro**:
   - `src/pages/api/activities.ts` (GET)
   - `src/pages/api/activities-generate.ts` (POST)
5. **Testy jednostkowe** (Vitest) dla service + walidatory.
6. **Testy integracyjne** (supertest lub Astro test) dla endpointów.
7. **CI** – uruchom lint + testy.
8. **Dokumentacja** – aktualizacja OpenAPI / README.
9. **Code review & merge**.
10. **Deployment** – GitHub Actions → Docker image → Cloudflare Pages.
