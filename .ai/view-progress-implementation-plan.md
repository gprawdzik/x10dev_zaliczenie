# Plan implementacji widoku Postępy celów

## 1. Przegląd
Widok prezentuje bieżący postęp realizacji celów rocznych użytkownika. Pokazuje kumulatywny wykres wykonania względem celu oraz listę kart celów z kluczowymi metadanymi i procentem realizacji. Obsługuje lazy loading wykresu, skeletony, paginację kart i dark mode.

## 2. Routing widoku
Ścieżka: `/` (Dashboard „Moje cele” – sekcja postępów w istniejącej stronie). Widok renderowany w `src/pages/index.astro` w oparciu o `AppLayout.astro`.

## 3. Struktura komponentów
- `AppLayout` (astro)  
  - `TopNavBar` / `BottomNavBar`
  - `ProgressView` (astro container, wstrzykuje dane i montuje wyspy)
    - `ProgressFilters` (Vue, client:load) – wybór roku/metryki/sportu
    - `ProgressPanel` (Vue island, client:visible)  
      - `ProgressChart` (Vue, lazy)  
      - `GoalList`  
        - `GoalCard` (w pętli, paginowane)  
        - `SkeletonRow` (placeholdery)  
    - `Toast` (global store / ui)

## 4. Szczegóły komponentów
### ProgressFilters
- Opis: Panel filtrów dla zapytania postępu.
- Główne elementy: select rok, select metryka (`distance`/`time`/`elevation_gain`), select sport (All/global lub konkretne ID).
- Obsługiwane interakcje: zmiana filtrów → emit `update:filters`.
- Walidacja: rok liczba całkowita w dopuszczalnym zakresie (np. 2000–current+1), metryka z enum, sport_id string/`null`.
- Typy: `ProgressFilterState`, `SelectOption`.
- Propsy: `modelValue: ProgressFilterState`, `sports: SelectOption[]`, `years: number[]`, `loading:boolean`.

### ProgressPanel
- Opis: Kontener stanu; pobiera dane z API i przekazuje do dzieci.
- Główne elementy: wrapper, sekcja wykresu, sekcja listy celów, komunikaty błędów.
- Obsługiwane interakcje: nasłuch `filters-change`, `page-change`, retry na błędzie.
- Walidacja: nie wysyła żądań przy niepełnych filtrach; blokuje podwójne fetch przy loading.
- Typy: `ProgressViewState`, `ProgressAnnualRequest`, `ProgressViewModel`.
- Propsy: `initialFilters`, `pageSize` (np. 6).

### ProgressChart
- Opis: Kumulatywny wykres wykonania vs cel.
- Główne elementy: obszar wykresu (np. area/line), legenda, wartości docelowe, tooltipy.
- Obsługiwane interakcje: hover tooltip, opcjonalny toggle trybu (dzienny/suma – domyślnie suma).
- Walidacja: serie posortowane po dacie; gdy pusto – pokazuje pusty stan.
- Typy: `ProgressSeriesVM` (date,label,value), `ProgressChartVM` (series,targetValue,achieved,percent,metric,year).
- Propsy: `series`, `targetValue`, `metricType`, `year`, `loading`, `error`, `onRetry`.

### GoalList
- Opis: Lista kart celów z paginacją.
- Główne elementy: nagłówek, pager (prev/next), siatka kart, pusty stan.
- Obsługiwane interakcje: `page-change`, kliknięcie karty (opcjonalnie do szczegółów).
- Walidacja: page w zakresie, brak danych → pusty stan.
- Typy: `GoalCardVM[]`, `PaginationState`.
- Propsy: `items`, `page`, `pageSize`, `total`, `loading`.

### GoalCard
- Opis: Pojedyncza karta celu.
- Główne elementy: tytuł (sport/scope), metryka, target, wykonanie, % progresu, badge scope/custom, pasek postępu.
- Obsługiwane interakcje: opcjonalny click/cta do edycji (jeśli dostępne).
- Walidacja: procent ucinany 0–999%, wartości nieujemne.
- Typy: `GoalCardVM`.
- Propsy: `goal: GoalCardVM`.

### SkeletonRow
- Opis: Placeholdery dla kart/wykresu.
- Główne elementy: prostokąty imitujące layout.
- Propsy: `rows?: number`, `variant?: 'chart'|'card'`.

### Toast
- Opis: globalne powiadomienia sukces/błąd.
- Wykorzystanie: błędy API, brak danych, sukces odświeżenia.

## 5. Typy
- Reużywane DTO: `ProgressAnnualRequest`, `ProgressAnnualResponse`, `ProgressAnnualSeries` z `src/types.ts`.
- Nowe ViewModel:
  - `ProgressFilterState`: `{ year: number; metric_type: 'distance'|'time'|'elevation_gain'; sport_id: string|null }`.
  - `ProgressViewState`: `{ data?: ProgressChartVM; goals: GoalCardVM[]; loading: boolean; error?: string; page: number; pageSize: number; total: number; }`.
  - `ProgressChartVM`: `{ series: ProgressSeriesVM[]; targetValue: number; achieved: number; percent: number; metric: string; year: number; scope: string; }`.
  - `ProgressSeriesVM`: `{ date: string; value: number; label: string; }`.
  - `GoalCardVM`: `{ id: string; title: string; scopeLabel: string; metricLabel: string; targetValue: string; achievedValue: string; percent: number; year: number; sportId: string|null; scopeType: string; }`.
  - `PaginationState`: `{ page: number; pageSize: number; total: number; }`.
  - `SelectOption`: `{ value: string|null; label: string; }`.

## 6. Zarządzanie stanem
- Kompozyt `useProgressAnnual(filters)` lub store Pinia `useProgressStore`:
  - Stan: `filters`, `loading`, `error`, `progress`, `cache` (klucz: year+metric+sport), `goals`, `pagination`.
  - Akcje: `loadProgress(filters)`, `setFilters`, `setPage`, `retry`.
  - Efekt: automatyczny fetch przy zmianie filtrów (debounce), cache dla identycznych filtrów.
- Źródła danych: `/api/progress-annual` (progress), istniejące API celów (lista do kart) lub zmapowanie z odpowiedzi progress (target/achieved) w przypadku pojedynczego celu.
- Hydration: `ProgressPanel` jako wyspa `client:visible` (lazy chart), filtry `client:load`.

## 7. Integracja API
- Endpoint: `POST /api/progress-annual` (lokalny, proxy do funkcji Supabase).
- Payload: `ProgressAnnualRequest` `{ year:number; metric_type:'distance'|'time'|'elevation_gain'; sport_id:string|null }`.
- Odpowiedź 200: `ProgressAnnualResponse` `{ year, metric_type, scope_type, series: {date,value}[], target_value }`.
- Błędy: 401 (AuthError), 415 (Content-Type), 400 (walidacja), 404 (brak celu), 500 (db/client). Mapować do toastów i/lub pustych stanów.
- Klient: fetch z nagłówkiem `Content-Type: application/json`, przekazanie session token przez Supabase middleware (astrowe locals).

## 8. Interakcje użytkownika
- Wejście na widok → auto-fetch domyślnych filtrów (rok bieżący, metryka domyślna np. distance, sport null).
- Zmiana roku/metryki/sportu → przeładowanie danych; pokazanie skeletonów.
- Paginacja kart celów → zmiana strony bez refetch (przy gotowej liście) lub z refetch jeżeli backend paginuje.
- Hover na wykresie → tooltip z datą i wartością.
- Retry po błędzie → ponowne wywołanie API.
- Dark mode → klasy Tailwind wspierające kolory.

## 9. Warunki i walidacja
- Front: rok liczbowy, metryka zgodna z enum, sport_id string/`null`; nie wysyłaj pustego body.
- API: wymaga `Content-Type: application/json`; walidacja Zod; auth wymagany.
- UI: brak danych/serii → komunikat „Brak danych dla wybranych filtrów” + zeroed wykres lub pusty stan kart.
- Procent: `percent = target ? min(achieved/target, 9.99)*100 : 0`.

## 10. Obsługa błędów
- 401: przekieruj do logowania lub pokaż toast „Sesja wygasła”.
- 404: pokaż pusty stan „Brak celu dla wybranych filtrów”.
- 400/415: toast z komunikatem walidacji.
- 500: toast „Problem z serwerem, spróbuj ponownie” + przycisk retry.
- Sieć/brak serii: fallback pusty wykres + skeletony kart.

## 11. Kroki implementacji
1) Zdefiniuj typy ViewModel w `src/types` lub lokalnym module widoku (`src/lib/view-models/progress.ts`).  
2) Dodaj composable/store `useProgressStore` (w `src/stores` lub `src/composables`) z cache, fetch, obsługą błędów.  
3) Utwórz `ProgressFilters` z kontrolkami roku/metyki/sportu i emisją zmian.  
4) Utwórz `ProgressChart` z lazy hydration (`client:visible`), obsługą loading/error/empty; mapuj serie do biblioteki wykresów (np. lightweight-charts lub prosty SVG).  
5) Utwórz `GoalCard` i `GoalList` z paginacją oraz `SkeletonRow` placeholdery.  
6) Zbuduj `ProgressPanel` integrujący composable, filtry, wykres, listę, retry, skeletony.  
7) W `src/pages/index.astro` podłącz `ProgressView`/`ProgressPanel` jako wyspę, wkomponuj w `AppLayout`, dodaj TopNav/BottomNav.  
8) Dodaj obsługę toastów dla błędów/progress refresh.  
9) Styluj Tailwind (dark mode klasy, responsywność, skeletony).  
10) Testy: jednostkowe dla mapowania serii i percent, komponentowe dla `ProgressPanel` (loading/error/empty), e2e smoke dla szczęśliwej ścieżki i błędu 404.

