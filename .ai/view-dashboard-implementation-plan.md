# Plan implementacji widoku Dashboard

## 1. Przegląd
Widok główny (dashboard) prezentuje skrót najważniejszych metryk po zalogowaniu: łączną liczbę celów rocznych, liczbę celów osiągniętych, liczbę aktywności w bieżącym miesiącu per sport oraz liczbę aktywności w bieżącym roku per sport. Layout wykorzystuje siatkę (1 kolumna mobile, 2–3 desktop), skeletony w trakcie ładowania i zachowuje kontrast w dark mode.

## 2. Routing widoku
Ścieżka: `/` (index.astro), dostępna po zalogowaniu. Widok osadzony w `AppLayout`, część interaktywna jako wyspa Vue z dyrektywą `client:load`.

## 3. Struktura komponentów
- `src/pages/index.astro`
  - layout `AppLayout`
  - wyspa `DashboardView` (Vue, `client:load`)
    - `StatCard` ×2 (cele łącznie, cele osiągnięte)
    - `ActivitiesBreakdown` (bieżący miesiąc)
    - `ActivitiesBreakdown` (bieżący rok)
    - `SkeletonRow` (placeholdery w trakcie ładowania list)

## 4. Szczegóły komponentów
### DashboardView (Vue)
- Opis: orkiestruje pobieranie danych, oblicza metryki i renderuje karty/sekcje breakdown.
- Główne elementy: nagłówek sekcji, siatka kart, dwie sekcje breakdown (miesiąc/rok) z listami wierszy.
- Obsługiwane interakcje: automatyczne ładowanie po mount, przycisk „Spróbuj ponownie” przy błędzie.
- Walidacja: guardy na brakujące dane (null/undefined), filtrowanie dat w zakresie bieżącego roku/miesiąca.
- Typy: `DashboardMetricsViewModel`, `BreakdownItem`, `ApiState<T>`.
- Propsy: brak (dane ładowane wewnętrznie).

### StatCard
- Opis: prezentacja pojedynczej metryki (label + value, opcjonalny opis/ikona).
- Główne elementy: tytuł, wartość, opcjonalny badge/bottom text.
- Interakcje: brak.
- Walidacja: obsługa stanu loading/error przez propsy.
- Typy: `StatCardProps { label: string; value: string | number; isLoading?: boolean; error?: string }`.
- Propsy: `label`, `value`, `isLoading?`, `error?`.

### ActivitiesBreakdown
- Opis: lista/tabela zliczeń aktywności per sport.
- Główne elementy: tytuł sekcji, lista wierszy (`sport` + `count`), pusty stan, skeletony.
- Interakcje: brak (tylko wyświetlenie).
- Walidacja: jeśli brak danych -> pusty stan; sortowanie wierszy malejąco po count.
- Typy: `BreakdownItem { sport: string; count: number }`.
- Propsy: `title: string; items: BreakdownItem[]; isLoading?: boolean; emptyLabel?: string`.

### SkeletonRow
- Opis: wiersz/placeholder do sekcji listowych i kart w trakcie ładowania.
- Propsy: wariant (card/list) lub długość; brak logiki.

## 5. Typy
- Reużywane: `GoalDto`, `ActivityDto`, `Paginated<T>`, `ProgressAnnualRequest/Response`, enumy `goal_scope_type`, `goal_metric_type` z `src/types.ts`.
- Nowe ViewModel/DTO (lokalne dla widoku):
  - `BreakdownItem { sport: string; count: number }`.
  - `DashboardMetricsViewModel { totalGoals: number; achievedGoals: number; activitiesMonth: BreakdownItem[]; activitiesYear: BreakdownItem[] }`.
  - `ApiState<T> { data: T | null; isLoading: boolean; error: string | null }`.
  - `DateRange { from: string; to: string }` (ISO, używane do zapytań).
- Pomocnicze funkcje typowane: `groupActivitiesBySport(activities: ActivityDto[]): Map<string, ActivityDto[]>`, `countBySport(activities: ActivityDto[]): BreakdownItem[]`, `isGoalAchieved(goal: GoalDto, totalsByMetricAndScope: Record<string, number>): boolean`.

## 6. Zarządzanie stanem
- Lokalny stan w `DashboardView` (Vue `ref/reactive`):
  - `goalsState: ApiState<GoalDto[]>`
  - `activitiesState: ApiState<ActivityDto[]>` (pobieramy rok i filtrujemy miesiąc lokalnie)
  - pochodne `computed`: `totalGoals`, `achievedGoals`, `activitiesMonth`, `activitiesYear`.
- Opcjonalny composable `useDashboardData` w `src/composables/useDashboardData.ts` z metodami `load()`, `retry()`, zwracający powyższe stany i computed.
- Brak globalnego store — stan ograniczony do wyspy.

## 7. Integracja API
- Cele: `GET /api/goals?year={currentYear}&limit=100` → `GoalDto[]` (RLS wymusza user_id). Pole `target_value` i `scope_type` wykorzystane do obliczeń.
- Aktywności: `GET /api/activities?from={YYYY-01-01}&to={YYYY-12-31}&limit=1000&sort_by=start_date&sort_dir=asc` → `Paginated<ActivityDto>`. Z jednego zestawu danych wyznaczamy:
  - aktywności bieżącego roku per sport,
  - aktywności bieżącego miesiąca per sport (filtrowanie po `start_date`).
- Obliczenie celów osiągniętych:
  - Zsumować metrykę (distance/time/elevation) z aktywności roku globalnie i per sport (`sport_type`).
  - Cel osiągnięty, gdy `target_value > 0` i suma dla danego scope/metryki ≥ target_value.
  - Dla scope `global` użyć agregacji globalnej; dla `per_sport` użyć per `sport_type` (wymaga mapowania `goal.sport_id -> sports.code`; jeśli brak danych sports, fallback na `goal.sport_id` lub pominąć osiągnięcie).
- Alternatywa (opcjonalna w przyszłości): `POST /functions/v1/progress-annual` dla precyzyjnego postępu pojedynczego celu, lecz zwiększa liczbę wywołań — na dashboard pomijamy dla szybkości.

## 8. Interakcje użytkownika
- Automatyczne ładowanie po wejściu na `/`.
- W trakcie ładowania: skeletony kart i wierszy listy.
- W przypadku błędu: komunikat + przycisk „Spróbuj ponownie” wykonujący ponowne pobranie obu zestawów danych.
- Brak dodatkowych kliknięć/nawigacji na komponentach; całość read-only.

## 9. Warunki i walidacja
- Zapytania API:
  - `year` liczbowy; `from/to` w ISO YYYY-MM-DD.
  - Limit ustawiony defensywnie (np. 1000) by pokryć 12 miesięcy symulowanych danych; jeśli API zwróci paginację z mniejszą liczbą, uwzględnić `total` vs `data.length`.
- Dane wejściowe:
  - Guard na pustą listę celów/aktywności → pusty stan.
  - Filtrowanie dat używa czasu UTC z `start_date`.
- UI:
  - Layout responsywny (Tailwind grid cols-1/2/3).
  - Dark mode: używać klas neutralnych (`bg-card`, `text-foreground` z shadcn/tailwind tokens).

## 10. Obsługa błędów
- 401 (Auth) → przekierowanie/komunikat (reuse middleware `requireAuth`; na kliencie pokaż komunikat „Sesja wygasła” i link do logowania).
- 4xx walidacja → pokaż skrócony komunikat „Nieprawidłowe parametry” + Retry.
- 5xx / sieć → toast/alert + Retry.
- Brak danych → pusty stan z copy „Brak aktywności w wybranym okresie” / „Brak celów”.

## 11. Kroki implementacji
1) Utwórz strukturę widoku: `src/pages/index.astro` z `AppLayout` i osadzoną wyspą `DashboardView` (`client:load`), dodaj meta tytuł.
2) Dodaj komponent `DashboardView.vue` w `src/components/views/` z siatką kart i sekcjami breakdown; zaimportuj UI z `ui/card`, `ui/button` jeśli istnieją.
3) Dodaj komponenty prezentacyjne (jeśli brak): `StatCard.vue`, `ActivitiesBreakdown.vue`, `SkeletonRow.vue` w `src/components/ui` lub `components/dashboard`.
4) (Opcjonalnie) Dodaj composable `useDashboardData.ts` w `src/composables/` zarządzający fetch, loading, error i computed metrykami; wpiąć w `DashboardView`.
5) Zaimplementuj fetch danych:
   - `goals`: `GET /api/goals?year=currentYear&limit=100`.
   - `activities`: `GET /api/activities?from=YYYY-01-01&to=YYYY-12-31&limit=1000&sort_by=start_date&sort_dir=asc`.
6) Zaimplementuj obliczenia:
   - grupowanie aktywności per sport,
   - filtr miesiąca (porównanie miesiąca i roku z daty ISO),
   - obliczenie `totalGoals` i `achievedGoals` (sumy metryki vs `target_value`, scope global/per_sport),
   - listy `BreakdownItem[]` posortowane malejąco po `count`.
7) Dodaj skeletony i stany błędu/pustki w `DashboardView` i komponentach breakdown.
8) Zapewnij responsywny układ (Tailwind grid), kontrast w dark mode; dopasuj spacing i typografię do istniejącego designu.
9) Dodaj podstawowe testy jednostkowe (Vitest) dla helperów obliczających osiągnięte cele i breakdown per sport (np. `isGoalAchieved`, `countBySport`).
10) Ręcznie przetestuj scenariusze: brak danych, pojedynczy sport, wiele sportów, błąd sieci, osiągnięty vs nieosiągnięty cel; sprawdź mobile/desktop w przeglądarce.

