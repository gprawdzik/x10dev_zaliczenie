# API Endpoint Implementation Plan: Annual Cumulative Progress (`/functions/v1/progress-annual`)

## 1. Przegląd punktu końcowego

Punkt końcowy dostarcza skumulowane wartości postępów użytkownika w danym roku dla wskazanego typu metryki i (opcjonalnie) dyscypliny. Dane służą do wykresów „My Goals” oraz zestawienia celu rocznego (target_value) dla wybranego zakresu (global/per_sport).

## 2. Szczegóły żądania

- Metoda HTTP: `POST`
- Struktura URL: `/functions/v1/progress-annual`
- Parametry:
  - Wymagane: `year` (number), `metric_type` (`goal_metric_type`), `sport_id` może być `null`
  - Opcjonalne: brak innych
- Request Body (JSON):
  - `year`: liczba całkowita (np. 2025), zakres rozsądny `>= 2000`
  - `metric_type`: enum `goal_metric_type` (`distance` | `time` | `elevation_gain`)
  - `sport_id`: `string | null`; jeśli null → zakres globalny; jeśli wartość UUID → zakres per_sport
- Nagłówki: `Authorization: Bearer <supabase_jwt>`

## 3. Wykorzystywane typy

- DTO wejścia: `ProgressAnnualRequest` (`src/types.ts`)
- DTO wyjścia: `ProgressAnnualResponse` (`src/types.ts`)
- Typy wspierające: `ProgressAnnualSeries`, enumy `goal_metric_type`, `goal_scope_type` (`db/database.types.ts`)

## 4. Szczegóły odpowiedzi

- 200 OK (sukces):
  - Struktura: `ProgressAnnualResponse`
    - `year`, `metric_type` echo z żądania
    - `scope_type`: `global` gdy `sport_id` jest `null`, inaczej `per_sport`
    - `series`: tablica `{ date: string (YYYY-MM-DD), value: number }` z wartościami skumulowanymi dzień po dniu
    - `target_value`: liczba z tabeli `goals.target_value` dla użytkownika, roku, metryki i zakresu (oraz `sport_id` dla per_sport)
- Błędy:
  - 400: niepoprawne dane wejściowe (walidacja)
  - 401: brak/nieprawidłowy JWT lub brak użytkownika w kontekście
  - 404: brak zdefiniowanego celu (`goals`) dla podanych filtrów
  - 500: nieoczekiwany błąd serwera / bazy

## 5. Przepływ danych

1. Autoryzacja: wydobycie `user_id` z kontekstu Supabase Edge Function (JWT).
2. Walidacja payload (Zod): `year` (int, min 2000), `metric_type` (enum), `sport_id` (uuid | null).
3. Ustalenie zakresu:
   - `scope_type = sport_id ? 'per_sport' : 'global'`.
4. Pobranie celu:
   - Z tabeli `goals` (`user_id`, `year`, `metric_type`, `scope_type`, `sport_id` gdy per_sport).
   - Jeśli brak rekordu → 404.
5. Pobranie aktywności:
   - Z `activities` filtrowane po `user_id` oraz `start_date` w roku `year`.
   - Dla `per_sport`: dodatkowy filtr `sport_type` lub `sport_id` jeśli takie pole istnieje; w razie braku kolumny mapować po `sport_type` zgodnie z logiką domeny (do doprecyzowania).
6. Agregacja dzienna:
   - Metryka:
     - `distance` → suma `distance` (zakładane metry).
     - `time` → suma `moving_time` (sekundy z intervalu).
     - `elevation_gain` → suma `total_elevation_gain`.
   - Grupowanie po dacie (UTC lub strefa użytkownika — użyć `start_date_local` jeśli chcemy zgodności z lokalnym rokiem; domyślnie `start_date`).
7. Sumowanie skumulowane:
   - Sortowanie rosnąco po dacie; budowa `series` z narastającą sumą.
   - Upewnić się, że brakujące dni mogą być pominięte (front może interpolować); jeśli wymagane pełne kontinuum, dopełnić zerami.
8. Budowa odpowiedzi `ProgressAnnualResponse` i zwrot 200.

## 6. Względy bezpieczeństwa

- Wymagane uwierzytelnienie (Supabase JWT); weryfikacja `user_id` z RLS.
- RLS już definiuje izolację po `user_id` (patrz `.ai/db-plan.md`), ale należy stosować filtry `user_id` w zapytaniach.
- Walidacja wejścia zapobiega SQL injection (parametryzowane zapytania) i błędom typu.
- Brak ujawniania danych innych użytkowników; 404 dla braku celu zamiast ujawnienia struktury bazy.
- Ograniczyć odpowiedź do potrzebnych pól; brak echo danych wejściowych poza wymaganymi.
- Logowanie błędów bez danych wrażliwych; unikać logowania tokenów.

## 7. Obsługa błędów

- 400: wynik walidacji Zod (np. `year` poza zakresem, nieznany `metric_type`, zły format `sport_id`).
- 401: brak kontekstu użytkownika (`getUser`/`getClient` zwróci null).
- 404: brak dopasowanego celu w `goals`.
- 500: wyjątki bazy lub nieoczekiwane błędy; log na stderr/console.
- Format błędów: stosować `ErrorDto` (`src/types.ts`) z polami `code`, `message`, opcjonalnie `details`.

## 8. Rozważania dotyczące wydajności

- Indeksy: wykorzystać `idx_activities_user_start_date` (user_id, start_date) i `idx_goals_user_year` (user_id, year).
- Agregacja: użyć pojedynczego zapytania SQL z `GROUP BY date_trunc('day', …)` zamiast iteracji po rekordach.
- Transfer: zwracać tylko potrzebne kolumny; ewentualnie paginacja niepotrzebna (rok ogranicza zakres).
- Cache: opcjonalne cache warstwy edge dla niezmiennych danych historycznych; nie wymagane na start.
- Limit roku: walidacja ogranicza wielkość zakresu.

## 9. Etapy wdrożenia

1. Przygotowanie schematu typów
   - Potwierdzić mapowanie metryk: `distance`→`distance`, `time`→`moving_time`, `elevation_gain`→`total_elevation_gain`.
   - Zweryfikować kolumnę powiązania sportu w `activities` (np. `sport_type` lub `sport_id`); ujednolicić w kodzie.
2. Walidacja wejścia
   - Dodać schemat Zod dla `ProgressAnnualRequest` (folder `src/validators` lub nowy plik) z: `year` int min 2000, `metric_type` enum, `sport_id` nullable uuid.
3. Autoryzacja
   - W edge function pobrać `user_id` z JWT (`supabaseClient.auth.getUser()`). W przypadku braku → 401.
4. Pobranie celu
   - Zapytanie do `goals` z filtrami: `user_id`, `year`, `metric_type`, `scope_type`, `sport_id` (dla per_sport). Brak → 404.
5. Agregacja aktywności
   - SQL z `GROUP BY date_trunc('day', start_date)` (lub `start_date_local` jeśli używamy czasu lokalnego).
   - Select: `date::date AS date`, `SUM(value)` jako `daily_value`, gdzie `value` zależy od metryki.
   - Filtry: `user_id`, `year` (BETWEEN first_day_of_year AND last_day_of_year), `sport_id`/`sport_type` jeśli per_sport.
6. Budowa serii skumulowanej
   - Posortować wyniki po `date`.
   - Iteracyjnie akumulować `daily_value` → `series`.
   - Serializować datę jako `YYYY-MM-DD`.
7. Odpowiedź 200
   - Zwrócić `ProgressAnnualResponse` (year, metric_type, scope_type, series, target_value).
8. Obsługa błędów
   - Mapować wyjątki walidacji na 400, brak celu na 404, resztę na 500 z `ErrorDto`.
9. Testy
   - Testy jednostkowe logiki agregacji (różne metryki, brak danych, dane w wielu dniach, filtr sportu).
   - Test walidacji payload (zły rok, zły UUID, zły enum).
   - Test integracyjny e2e (autoryzacja, brak celu, sukces global, sukces per_sport).
