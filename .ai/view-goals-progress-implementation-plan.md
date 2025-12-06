# Plan implementacji widoku „Moje cele” – postępy

## 1. Przegląd

Widok `/goals` prezentuje bieżący postęp rocznych celów użytkownika: wykres kumulatywny wykonania vs cel, lista kart celów z kluczowymi metadanymi oraz wykres porównawczy celu do realizacji. Priorytety: aktualne dane z Supabase, płynne ładowanie (lazy dla wykresów), skeletony, tryb ciemny, paginacja kart.

## 2. Routing widoku

- Ścieżka: `/goals` (Astro page).
- Bez Vue Router; Vue komponenty hydratowane jako islands `client:visible`/`client:idle`.

## 3. Struktura komponentów

- `src/pages/goals.astro` (wrapper + layout + fetch/server props jeśli potrzebne).
  - `TopNavBar` / `BottomNavBar`
  - `GoalsView` (Vue, `client:visible`)
    - `GoalsFiltersBar`
    - `ProgressSection`
      - `ProgressChart` (lazy)
      - `ProgressLegend` (target/metryka/zakres)
    - `ComparisonSection`
      - `GoalsComparisonChart` (lazy)
    - `GoalsListSection`
      - `GoalsList`
        - `GoalCard` (pętla)
        - `SkeletonRow` (loading)
      - `PaginationControls`
    - `Toast` (global store)
    - `EmptyState`

## 4. Szczegóły komponentów

### GoalsView

- Opis: główny kontener stanu; spina filtry, dane wykresów i listę celów.
- Główne elementy: wrapper div/section; dzieci: FiltersBar, Progress/Comparison, GoalsList.
- Interakcje: `onFiltersChange`, `onPageChange`, `onReload`.
- Walidacja: filtry (rok liczba, `metric_type` w enum, `sport_id|null`), strona >=1.
- Typy: `FiltersState`, `ProgressAnnualResponse`, `GoalDto[]`, `Paginated<GoalDto>`.
- Propsy: opcjonalne dane startowe (SSR) `initialGoals`, `initialProgress`.

### GoalsFiltersBar

- Opis: kontrolki wyboru roku, metryki, sportu; toggle widoku.
- Elementy: select rok, select metryka (distance/time/elevation_gain), select sport (opcjonalnie), toggle `viewMode`.
- Interakcje: `change:filters` (emit), opcjonalnie `reset`.
- Walidacja: rok w zakresie [bieżący±2], metryka w enum, sport musi istnieć w liście.
- Typy: `FiltersState`, `FilterOption`.
- Propsy: `value: FiltersState`, `sports: FilterOption[]`, `loading: boolean`.

### ProgressChart

- Opis: wykres liniowy kumulatywny bieżącego roku; lazy load.
- Elementy: canvas/SVG (np. Chart.js/echarts), legendy, tooltipy.
- Interakcje: hover tooltip; opcjonalny zoom/scroll off.
- Walidacja: `series` posortowane, daty ISO `YYYY-MM-DD`, wartości >=0; `target_value` >=0.
- Typy: `ProgressAnnualSeries[]`, `ProgressChartViewModel`.
- Propsy: `{ series, targetValue, year, metricType, scopeType }`, `loading`.

### GoalsComparisonChart

- Opis: wykres porównawczy cel vs wykonanie (np. słupki target vs last cumulative).
- Elementy: bar/dual-line chart; legenda cel/realizacja.
- Interakcje: hover tooltip.
- Walidacja: dane znormalizowane (target>=0, actual>=0).
- Typy: `ComparisonPoint { label: string; target: number; actual: number }[]`.
- Propsy: `{ data, metricType, loading }`.

### GoalsList

- Opis: renderuje listę celów z paginacją; skeletony w trakcie ładowania.
- Elementy: wrapper grid/lista, `GoalCard`, `SkeletonRow`, `PaginationControls`, `EmptyState`.
- Interakcje: `pageChange`, `retry`.
- Walidacja: strona/liczba elementów >0; brak danych -> `EmptyState`.
- Typy: `Paginated<GoalDto>`, `GoalListItemViewModel`.
- Propsy: `{ items, page, total, limit, loading, error }`.

### GoalCard

- Opis: pojedyncza karta celu z metryką, zakresem, wartością docelową i postępem %.
- Elementy: tytuł/nazwa (np. metryka + zakres), chip metryki/sportu, progress bar, liczby (`currentValue`, `targetValue`, `%`), akcje (opcjonalnie link do edycji).
- Interakcje: klik (opcjonalny onSelect), hover tooltip.
- Walidacja: wartości >=0; procent obliczany z guardem (target>0).
- Typy: `GoalListItemViewModel`.
- Propsy: `{ goal: GoalListItemViewModel }`.

### PaginationControls

- Opis: zmiana strony listy.
- Elementy: przyciski poprzednia/następna, wskaźnik strony.
- Interakcje: `pageChange`.
- Walidacja: zakres stron.
- Typy: `PaginationState`.
- Propsy: `{ page, total, limit, disabled }`.

### ProgressLegend

- Opis: pokazuje aktualne ustawienia filtra (rok, metryka, scope) + target.
- Elementy: badge metryki, scope label, target value formatted.
- Interakcje: brak.
- Walidacja: target >=0.
- Typy: `ProgressChartViewModel`.
- Propsy: `{ viewModel, loading }`.

### EmptyState / Toast / SkeletonRow / Navbar

- Standardowe UI; wykorzystują istniejące komponenty shadcn/vue/Tailwind.
- Walidacja: brak.
- Propsy: treść, wariant.

## 5. Typy

- `FiltersState`: `{ year: number; metric: Enums<"goal_metric_type">; sportId: string | null; viewMode: "cumulative" | "comparison"; page: number; limit: number; }`.
- `FilterOption`: `{ value: string; label: string }`.
- `ProgressChartViewModel`: `{ year: number; metricType: Enums<"goal_metric_type">; scopeType: Enums<"goal_scope_type">; series: ProgressAnnualSeries[]; targetValue: number; completionPct: number; lastValue: number; }`.
- `ComparisonPoint`: `{ label: string; target: number; actual: number }`.
- `GoalListItemViewModel`: `{ id: string; title: string; scopeLabel: string; metricLabel: string; targetValueFormatted: string; currentValueFormatted: string; progressPct: number; trend?: "up" | "flat" | "down"; }`.
- `PaginationState`: `{ page: number; limit: number; total: number }`.
- `ApiErrorView`: `{ code: string; message: string }`.
- Reużywane DTO: `ProgressAnnualRequest/Response/Series`, `GoalDto`, `Paginated<T>`.

## 6. Zarządzanie stanem

- Lokalne w `GoalsView` (Vue island) + ewentualnie Pinia store (opcjonalnie dla toastów już istniejących).
- Stan: `filters`, `progressData`, `comparisonData`, `goalsPage`, `loading.progress`, `loading.goals`, `error.progress`, `error.goals`, `isChartHydrated`.
- Composables:
  - `useAnnualProgress(filters)`: POST `/functions/v1/progress-annual`, trzyma `data/loading/error`, memoizuje po kluczach filtrów.
  - `useGoals(filtersPagination)`: GET `/api/goals`, trzyma `Paginated<GoalDto>`.
- Derived: `progressViewModel` (ostatnia wartość serii, %), `comparisonData` (target vs actual z celów/serii).
- Aktualizacje: zmiana filtrów -> równoległy refetch (abort poprzedniego żądania jeśli używamy AbortController).

## 7. Integracja API

- POST `/functions/v1/progress-annual`
  - Body: `{ year: number; metric_type: Enums<"goal_metric_type">; sport_id: string | null }`.
  - Response: `{ year; metric_type; scope_type; series: {date,value}[]; target_value: number }`.
  - Walidacja przed wysłaniem: rok liczba, metryka w enum, sport_id nullable string.
- GET `/api/goals`
  - Query: `page`, `limit`, opcjonalnie `sport_id`, `scope_type`, `metric_type`, `sort_by`, `sort_dir`.
  - Response: `Paginated<GoalDto>` lub pojedynczy `GoalDto`.
- Mapowanie do widoku:
  - `series` -> `ProgressChart`.
  - `target_value` z response; jeśli 0, dodatkowo zmapować docelowe wartości z `GoalDto` wybranego filtra (np. pierwszy dopasowany cel) do legendy/comparison.
  - `GoalDto` -> `GoalListItemViewModel` (formatowanie jednostek/metryk).

## 8. Interakcje użytkownika

- Zmiana roku/metryki/sportu/viewMode -> refetch progress + goals; pokaż skeleton/loader; zachować stronę=1 przy zmianie filtra.
- Paginacja listy -> refetch tylko goals; utrzymać progress bez zmian.
- Hover na wykresach -> tooltip; legendy aktualizują wartości.
- Retry przy błędzie -> ponowne wywołanie API.
- Dark mode: klasy Tailwind; wykresy reagują na prefers-color-scheme (theme refresh).

## 9. Warunki i walidacja

- `year` w dozwolonym zakresie (np. 2020–2030); domyślnie bieżący rok.
- `metric_type` w enum `goal_metric_type`; fallback do `distance`.
- `sport_id` może być `null`; jeśli ustawione musi istnieć w `sports` options.
- `series` musi być posortowane i spójne daty ISO; brak/NaN wartości odfiltrować (frontend guard).
- `target_value <=0` -> wyświetl komunikat „Brak zdefiniowanego celu” i ukryj %.
- Paginacja: `page>=1`, `limit` z bezpiecznego zestawu (np. 5/10/20).

## 10. Obsługa błędów

- Sieć/API: pokaż toast `error`, sekcja z komunikatem i przyciskiem „Spróbuj ponownie”.
- 401/403 (auth): przekierowanie/login prompt (zależnie od globalnego middleware).
- 400 walidacja: pokaż tooltip/inline w filtrach, nie zmieniaj poprzedniej wartości.
- Brak danych: wykres z zerową linią i opis „Brak aktywności dla wybranych filtrów”, `EmptyState` dla listy.
- Retry logic w composables (jednokrotny retry lub manualny).

## 11. Kroki implementacji

1. Utwórz stronę `src/pages/goals.astro` z layoutem i montażem `GoalsView` (`client:visible`), przekazując initial props (opcjonalnie rok/metryka z server-side).
2. Dodaj Vue komponent `GoalsView` w `src/components/views/GoalsView.vue` z lokalnym stanem filtrów, orchestracją fetchy i renderowaniem sekcji.
3. Zaimplementuj `GoalsFiltersBar` (selecty, viewMode), z walidacją i emitami.
4. Dodaj composable `useAnnualProgress` (`src/composables/useAnnualProgress.ts`) – POST `/functions/v1/progress-annual`, obsługa loading/error.
5. Wykorzystaj istniejący/lub dodaj `useGoals` do paginowanego pobierania celów z `/api/goals`.
6. Zaimplementuj `ProgressChart` (lazy import biblioteki wykresów; klient `client:idle`), z legendą/tooltipami i wskaźnikiem targetu.
7. Zaimplementuj `GoalsComparisonChart` (bar/line) korzystając z targetów i ostatniej wartości serii; uwzględnij brak celu.
8. Dodaj `GoalsList` + `GoalCard` + `PaginationControls` + `SkeletonRow`; mapuj `GoalDto` -> `GoalListItemViewModel` z formatowaniem jednostek.
9. Zaimplementuj obsługę błędów i `EmptyState` w sekcjach; podłącz toast store.
10. Dodaj wsparcie dla dark mode (klasy Tailwind + theme props przekazywane do wykresów).
11. Testy: podstawowe testy jednostkowe composables (mock fetch), snapshoty komponentów, e2e scenariusz „przegląd postępu” (ładowanie, zmiana filtra, paginacja, błąd).
12. Krótkie QA: weryfikacja skeletonów, lazy load wykresów, poprawności formatów dat i jednostek, resp. na mniejsze ekrany.
