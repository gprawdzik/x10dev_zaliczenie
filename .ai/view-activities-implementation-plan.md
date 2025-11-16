# Plan implementacji widoku Moje aktywności

## 1. Przegląd

Widok "Moje aktywności" ma na celu umożliwienie użytkownikom przeglądania, sortowania i paginacji listy wszystkich wygenerowanych dla nich aktywności treningowych. Jest to kluczowy element aplikacji, który pozwala na wgląd w historyczne dane, na podstawie których działają inne moduły, takie jak cele i sugestie AI.

## 2. Routing widoku

Widok będzie dostępny pod następującą ścieżką:
`/activities`

Dostęp do tej ścieżki powinien być chroniony i wymagać zalogowanego użytkownika. Strona `src/pages/activities.astro` będzie odpowiedzialna za sprawdzenie sesji użytkownika i ewentualne przekierowanie na stronę logowania.

## 3. Struktura komponentów

Hierarchia komponentów zostanie zaimplementowana w architekturze "Islands" Astro. Główny komponent `ActivitiesView.vue` będzie interaktywną wyspą, która zarządza stanem i logiką.

```
- src/pages/activities.astro
  - AppLayout.astro
    - ActivitiesView.vue (client:load)
      - SortDropdown.vue
      - ActivitiesTable.vue
        - (komponenty tabeli z shadcn/vue)
        - Skeleton loader (ładowanie)
        - Komunikat o braku danych
      - PaginationControl.vue
        - (komponenty paginacji z shadcn/vue)
```

## 4. Szczegóły komponentów

### `ActivitiesView.vue`

- **Opis komponentu**: Główny komponent-kontener, który orkiestruje działanie całego widoku. Odpowiada za zarządzanie stanem (paginacja, sortowanie), komunikację z API za pośrednictwem dedykowanego composable (`useActivities`) oraz przekazywanie danych i obsługę zdarzeń z komponentów podrzędnych.
- **Główne elementy**: Komponent będzie zawierał `SortDropdown`, `ActivitiesTable` i `PaginationControl`.
- **Obsługiwane interakcje**:
  - Zmiana strony z `PaginationControl`.
  - Zmiana kryterium sortowania z `SortDropdown`.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `ActivityViewModel`, `Paginated`, `SortOptions`.
- **Propsy**: Brak.

### `ActivitiesTable.vue`

- **Opis komponentu**: Komponent prezentacyjny, odpowiedzialny za renderowanie listy aktywności w formie tabeli. Obsługuje stan ładowania (wyświetlając skeleton) oraz stan pusty (wyświetlając odpowiedni komunikat).
- **Główne elementy**: Wykorzystuje komponenty `Table`, `TableHeader`, `TableRow`, `TableHead`, `TableBody`, `TableCell` z biblioteki `shadcn/vue` do zbudowania struktury tabeli. Użyje również komponentu `Skeleton` do wizualizacji stanu ładowania.
- **Obsługiwane interakcje**: Brak (komponent jest tylko do odczytu).
- **Obsługiwana walidacja**: Brak.
- **Typy**: `ActivityViewModel`.
- **Propsy**:
  - `activities: ActivityViewModel[]` - Tablica aktywności do wyświetlenia.
  - `isLoading: boolean` - Flaga informująca o stanie ładowania danych.

### `PaginationControl.vue`

- **Opis komponentu**: Komponent do nawigacji między stronami listy aktywności. Wyświetla przyciski "Poprzednia", "Następna" oraz numery stron.
- **Główne elementy**: Wykorzystuje komponent `Pagination` z `shadcn/vue`.
- **Obsługiwane interakcje**: Kliknięcie na numer strony lub przyciski nawigacyjne, co emituje zdarzenie `page-change`.
- **Obsługiwana walidacja**: Przyciski "Poprzednia"/"Następna" są wyłączone, gdy użytkownik jest odpowiednio na pierwszej/ostatniej stronie.
- **Typy**: `number`.
- **Propsy**:
  - `currentPage: number`
  - `totalPages: number`
  - `totalItems: number`
  - `itemsPerPage: number`

### `SortDropdown.vue`

- **Opis komponentu**: Komponent pozwalający użytkownikowi wybrać pole, według którego mają być posortowane aktywności, oraz kierunek sortowania (rosnąco/malejąco).
- **Główne elementy**: Wykorzystuje komponent `Select` lub `DropdownMenu` z `shadcn/vue`.
- **Obsługiwane interakcje**: Zmiana wybranej opcji sortowania emituje zdarzenie `sort-change` z nowymi parametrami.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `SortOption`, `SortDirection ('asc' | 'desc')`.
- **Propsy**:
  - `sortBy: string`
  - `sortDir: 'asc' | 'desc'`
  - `options: SortOption[]`

## 5. Typy

### DTO (Data Transfer Object) - z API

**`ActivityDto`** (Typ `Tables<'activities'>` z `database.types.ts`)

```typescript
interface ActivityDto {
  id: string
  user_id: string
  name: string
  type: string
  sport_type: string
  start_date: string // "2025-09-01T12:00:00Z"
  start_date_local: string // "2025-09-01T14:00:00+02:00"
  timezone: string
  utc_offset: number
  distance: number // w metrach
  moving_time: string // "3600s"
  elapsed_time: string // "3700s"
  total_elevation_gain: number
  average_speed: number
}
```

**`Paginated<T>`**

```typescript
interface Paginated<T> {
  data: T[]
  page: number
  limit: number
  total: number
}
```

### ViewModel - na potrzeby widoku

**`ActivityViewModel`** (Przetworzony `ActivityDto` do wyświetlania)

```typescript
interface ActivityViewModel {
  id: string
  name: string
  type: string
  startDate: string // sformatowana data, np. "1 wrz 2025, 14:00"
  distance: string // sformatowany dystans, np. "10.0 km"
  duration: string // sformatowany czas trwania, np. "1h 0m"
  elevation: string // sformatowane przewyższenie, np. "120 m"
  pace: string // obliczone tempo, np. "6:00 /km"
}
```

**`SortOption`**

```typescript
interface SortOption {
  value: string // np. 'start_date'
  label: string // np. 'Data'
}
```

## 6. Zarządzanie stanem

Stan widoku będzie zarządzany lokalnie w komponencie `ActivitiesView.vue` przy użyciu Vue Composition API (`ref`, `reactive`). Logika pobierania danych i zarządzania stanem zostanie wydzielona do dedykowanego composable `useActivities.ts`.

**Composable `useActivities.ts`**

- **Cel**: Hermetyzacja logiki związanej z aktywnościami (pobieranie danych, paginacja, sortowanie, obsługa stanu ładowania i błędów).
- **Zarządzany stan**:
  - `activities: Ref<ActivityViewModel[]>`
  - `isLoading: Ref<boolean>`
  - `error: Ref<string | null>`
  - `pagination: Reactive<{ page: number, limit: number, total: number }>`
  - `sorting: Reactive<{ sortBy: string, sortDir: 'asc' | 'desc' }>`
- **Użycie**: `ActivitiesView.vue` będzie korzystać z tego hooka do pobierania danych i funkcji do modyfikacji stanu (np. `changePage`, `changeSort`). `watchEffect` wewnątrz composable będzie automatycznie pobierał dane ponownie przy zmianie paginacji lub sortowania.

## 7. Integracja API

- **Endpoint**: `GET /api/activities`
- **Parametry zapytania**:
  - `page: number`
  - `limit: number`
  - `sort_by: string`
  - `sort_dir: 'asc' | 'desc'`
- **Typ odpowiedzi**: `Paginated<ActivityDto>`
- **Proces**:
  1.  Komponent `ActivitiesView` inicjalizuje `useActivities`.
  2.  `useActivities` wywołuje funkcję pobierającą dane, przekazując aktualne parametry paginacji i sortowania.
  3.  W odpowiedzi otrzymuje obiekt `Paginated<ActivityDto>`.
  4.  Dane `ActivityDto[]` są mapowane na `ActivityViewModel[]` (w tym formatowanie wartości).
  5.  Stan `activities`, `pagination`, `isLoading` i `error` jest aktualizowany.

## 8. Interakcje użytkownika

- **Wejście na stronę `/activities`**:
  - Wyświetlany jest skeleton loader.
  - Pobierana jest pierwsza strona aktywności (domyślnie sortowana po dacie malejąco).
  - Po załadowaniu danych tabela jest wypełniana, a kontrolki paginacji aktualizowane.
- **Zmiana strony**:
  - Użytkownik klika na numer strony w `PaginationControl`.
  - Emitowane jest zdarzenie `page-change`.
  - `ActivitiesView` aktualizuje stan paginacji w `useActivities`.
  - `watchEffect` uruchamia ponowne pobranie danych dla nowej strony.
  - Tabela przechodzi w stan ładowania, a następnie wyświetla nowe dane.
- **Zmiana sortowania**:
  - Użytkownik wybiera nową opcję w `SortDropdown`.
  - Emitowane jest zdarzenie `sort-change`.
  - `ActivitiesView` aktualizuje stan sortowania w `useActivities`.
  - `watchEffect` uruchamia ponowne pobranie danych z nowym sortowaniem (resetując paginację do strony 1).
  - Tabela przechodzi w stan ładowania, a następnie wyświetla posortowane dane.

## 9. Warunki i walidacja

- **Uwierzytelnianie**: Dostęp do strony `/activities` jest zablokowany dla niezalogowanych użytkowników. Logika przekierowania znajduje się w pliku `src/pages/activities.astro`.
- **Paginacja**: Przyciski "Poprzednia" i "Następna" w `PaginationControl` są nieaktywne, gdy użytkownik znajduje się odpowiednio na pierwszej lub ostatniej stronie wyników.
- **Puste dane**: Jeśli API zwróci pustą listę aktywności, `ActivitiesTable` wyświetli komunikat informujący o braku danych, np. "Nie znaleziono żadnych aktywności. Wygeneruj je w panelu, aby zobaczyć je tutaj."

## 10. Obsługa błędów

- **Błąd API**: W przypadku niepowodzenia zapytania do `/api/activities` (np. błąd serwera 500, problem z siecią), `useActivities` przechwyci błąd i ustawi stan `error`.
- **Komunikat dla użytkownika**: `ActivitiesView` wyświetli stosowny komunikat o błędzie (np. "Nie udało się załadować aktywności. Spróbuj ponownie później.") zamiast tabeli.
- **Brak uwierzytelnienia**: Użytkownik zostanie automatycznie przekierowany na stronę logowania.

## 11. Kroki implementacji

1.  **Stworzenie strony i routingu**: Utworzenie pliku `src/pages/activities.astro`, który będzie renderował główny layout i zawierał logikę ochrony trasy.
2.  **Utworzenie composable**: Implementacja `src/composables/useActivities.ts` z całą logiką zarządzania stanem i komunikacji z API.
3.  **Implementacja komponentów widoku**:
    - Stworzenie szkieletu komponentu `ActivitiesView.vue`, który używa `useActivities`.
    - Implementacja `ActivitiesTable.vue`, w tym obsługa stanu ładowania (skeleton) i pustego stanu.
    - Implementacja `PaginationControl.vue` z wykorzystaniem komponentów `shadcn/vue`.
    - Implementacja `SortDropdown.vue` z wykorzystaniem komponentów `shadcn/vue`.
4.  **Stworzenie funkcji pomocniczych**: Utworzenie `src/lib/formatters.ts` (lub podobnego) do formatowania dat, dystansów, czasu trwania itp. na potrzeby `ActivityViewModel`.
5.  **Połączenie komponentów**: Złożenie wszystkich komponentów w `ActivitiesView.vue`, przekazanie propsów i obsługa zdarzeń.
6.  **Stylowanie**: Dopracowanie wyglądu za pomocą Tailwind CSS, aby zapewnić spójność z resztą aplikacji.
7.  **Testowanie manualne**: Weryfikacja wszystkich interakcji użytkownika, obsługi błędów i przypadków brzegowych (brak aktywności, błąd API).
