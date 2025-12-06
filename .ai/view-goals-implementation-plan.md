# Plan implementacji widoku Cele (Goals)

## 1. Przegląd

Widok "Moje cele" stanowi główny dashboard aplikacji StravaGoals. Umożliwia użytkownikowi przeglądanie rocznych celów treningowych, śledzenie postępów (wizualizacja kumulatywna i na kartach) oraz zarządzanie celami (dodawanie, edycja, usuwanie).

Ze względu na etap MVP, dane dotyczące postępu (wykonanie) będą na razie zamockowane (wykres kumulatywny = 50%, karty = brak danych lub 0%).

## 2. Routing widoku

Widok będzie dostępny na ścieżce głównej: `/`.
Implementacja nastąpi w pliku `src/pages/index.astro`, który będzie renderował główny komponent widoku `GoalsView`.

## 3. Struktura komponentów

Główny kontener `GoalsView` będzie zarządzał stanem i komunikacją z API.

*   `src/pages/index.astro` (Strona Astro)
    *   `AppLayout` (Layout aplikacji)
        *   `GoalsView` (Główny widok - Container)
            *   `GoalsHeader` (Nagłówek z tytułem i przyciskiem "Dodaj cel")
            *   `ProgressChart` (Komponent wizualizacji - Mock 50%)
            *   `GoalList` (Lista kafelków z celami)
                *   `GoalCard` (Pojedynczy cel)
                    *   `GoalProgress` (Pasek postępu na karcie - Mock)
                    *   `GoalActions` (Dropdown menu: Edytuj, Usuń)
            *   `GoalFormDialog` (Modal do tworzenia i edycji celu)
            *   `DeleteGoalDialog` (Modal potwierdzenia usunięcia)
            *   `EmptyGoalsState` (Widok pustego stanu)

## 4. Szczegóły komponentów

### `GoalsView.vue` (Views)
- **Opis komponentu**: Główny komponent orkiestrujący widok. Odpowiada za pobranie listy celów i sportów oraz zarządzanie stanem widoczności modali (dodawanie, edycja, usuwanie).
- **Główne elementy**: `GoalsHeader`, `ProgressChart`, `GoalList`, `GoalFormDialog`, `DeleteGoalDialog`.
- **Obsługiwane interakcje**: Otwieranie formularza dodawania, obsługa zdarzeń edycji i usuwania przekazywanych z listy.
- **Obsługiwana walidacja**: Brak bezpośredniej walidacji (delegowana do formularzy).
- **Typy**: `GoalDto`, `SportDto`.
- **Propsy**: Brak.

### `GoalsHeader.vue`
- **Opis komponentu**: Sekcja nagłówkowa z tytułem i główną akcją.
- **Główne elementy**: `h1` (Tytuł), `Button` (Dodaj cel).
- **Obsługiwane interakcje**: Kliknięcie przycisku emituje zdarzenie otwarcia formularza.
- **Propsy**: Brak.

### `ProgressChart.vue`
- **Opis komponentu**: Wizualizacja postępu rocznego dla wszystkich celów.
- **Główne elementy**: Kontener graficzny (np. prosty pasek postępu lub SVG).
- **Wymagania MVP**: Wyświetla statyczną wartość 50% jako mock.
- **Propsy**: Brak (w MVP).

### `GoalList.vue`
- **Opis komponentu**: Kontener siatki (grid) wyświetlający karty celów.
- **Główne elementy**: Grid responsywny, iteracja `v-for` po liście celów.
- **Obsługiwane interakcje**: Przekazywanie zdarzeń `edit` i `delete` z kart do widoku głównego.
- **Propsy**: `goals` (`GoalDto[]`), `sports` (`Record<string, SportDto>` - do mapowania nazw).

### `GoalCard.vue`
- **Opis komponentu**: Karta wyświetlająca pojedynczy cel.
- **Główne elementy**:
    - Nagłówek: Ikona, Rok, Nazwa (Globalny lub nazwa sportu).
    - Treść: Metryka (np. "Dystans"), Wartość (np. "2000 km").
    - Stopka: Pasek postępu (Mock), Procent (Mock).
    - Akcje: Dropdown menu (Edytuj, Usuń).
- **Obsługiwane interakcje**: Kliknięcie opcji w menu akcji.
- **Propsy**: `goal` (`GoalDto`), `sportName` (string | undefined).

### `GoalFormDialog.vue`
- **Opis komponentu**: Modal z formularzem do tworzenia i edycji celu.
- **Główne elementy**:
    - `Dialog` (kontener).
    - Formularz z polami: `scope_type`, `sport_id` (warunkowe), `year`, `metric_type`, `target_value`.
- **Obsługiwana walidacja**:
    - Zod schema (`createGoalSchema`, `updateGoalSchema`).
    - `sport_id` wymagany tylko dla `scope_type = 'per_sport'`.
    - `target_value` musi być liczbą dodatnią.
- **Typy**: `CreateGoalInput`, `UpdateGoalInput`.
- **Propsy**: `open` (boolean), `mode` ('create' | 'edit'), `initialData` (GoalDto | null), `sports` (SportDto[]).

## 5. Typy

Wykorzystanie typów zdefiniowanych w `src/types.ts` oraz `src/validators/goals.ts`.

- **Modele danych**:
    - `GoalDto`: Pełny obiekt celu z bazy.
    - `SportDto`: Obiekt sportu (id, name).

- **Typy formularzy**:
    - `CreateGoalInput`: Typ dla nowego celu (z `createGoalSchema`).
    - `UpdateGoalInput`: Typ dla aktualizacji (z `updateGoalSchema`).

- **Stan formularza**:
    - `GoalFormState`: Obiekt reaktywny przechowujący wartości pól formularza.

## 6. Zarządzanie stanem

Wykorzystanie **Composables** do separacji logiki biznesowej od widoku.

- **`useGoals`**:
    - Stan: `goals` (lista celów), `isLoading`, `error`.
    - Metody:
        - `fetchGoals(query)`: Pobranie listy.
        - `addGoal(data)`: Utworzenie celu i odświeżenie listy.
        - `updateGoal(id, data)`: Aktualizacja celu i odświeżenie.
        - `removeGoal(id)`: Usunięcie celu.

- **`useSports`**:
    - Stan: `sports` (lista sportów).
    - Metody: `fetchSports()` (pobranie słownika sportów).

- **Stan lokalny widoku (`GoalsView`)**:
    - `isFormOpen`: boolean.
    - `editingGoal`: GoalDto | null.
    - `isDeleteOpen`: boolean.
    - `goalToDelete`: GoalDto | null.

## 7. Integracja API

Komunikacja z backendem poprzez `fetch` w composables.

- **GET /api/goals**:
    - Pobieranie listy celów.
    - Parametry: `year` (domyślnie obecny).
    - Odpowiedź: `GoalDto[]` (lub paginowana struktura, jeśli API zwraca paginację - API zwraca tablicę w `data` dla paginacji).
    - *Uwaga*: Endpoint `GET` w `src/pages/api/goals.ts` zwraca `paginatedGoals` (format `Paginated<GoalDto>`). Należy obsłużyć `response.data`.

- **POST /api/goals**:
    - Payload: `CreateGoalInput` (JSON).
    - Nagłówki: `Content-Type: application/json`.

- **PATCH /api/goals?id={id}**:
    - Payload: `UpdateGoalInput` (JSON).
    - Aktualizacja tylko zmienionych pól.

- **DELETE /api/goals?id={id}**:
    - Usunięcie zasobu.

- **GET /api/sports**:
    - Pobranie listy sportów do selecta.

## 8. Interakcje użytkownika

1.  **Ładowanie widoku**:
    - Użytkownik wchodzi na stronę główną.
    - Aplikacja pobiera listę celów i sportów.
    - Wyświetla się loader (szkielety kart).
    - Po załadowaniu pojawia się lista kart lub komunikat o braku celów.

2.  **Dodawanie celu**:
    - Użytkownik klika "Dodaj cel".
    - Pojawia się modal.
    - Użytkownik wypełnia formularz (wybiera typ, metrykę, wartość).
    - Kliknięcie "Zapisz" uruchamia walidację.
    - Po sukcesie modal znika, pojawia się toast "Cel dodany", lista się odświeża.

3.  **Edycja celu**:
    - Użytkownik klika menu na karcie celu -> "Edytuj".
    - Pojawia się modal z wypełnionymi danymi.
    - Użytkownik zmienia np. wartość docelową.
    - Zapis -> Toast "Cel zaktualizowany" -> Odświeżenie listy (i wykresu).

4.  **Usuwanie celu**:
    - Użytkownik klika menu na karcie -> "Usuń".
    - Modal potwierdzenia pyta "Czy na pewno?".
    - Potwierdzenie -> Usunięcie -> Toast "Cel usunięty" -> Cel znika z listy.

## 9. Warunki i walidacja

- **Walidacja formularza (Zod)**:
    - Pola wymagane muszą być wypełnione.
    - Wartość celu > 0.
    - Rok w rozsądnym zakresie (2000-2100).
    - Jeśli `scope_type` to `per_sport`, `sport_id` jest wymagany.
    - Jeśli `scope_type` to `global`, `sport_id` musi być pusty (ukryty/wyczyszczony).

## 10. Obsługa błędów

- **Błąd pobierania danych**: Wyświetlenie komunikatu błędu w miejscu listy lub Toast.
- **Błąd zapisu/edycji**: Pozostawienie modala otwartego, wyświetlenie błędu walidacji pod polem lub globalnego błędu w Toaście.
- **Błąd usuwania**: Toast z informacją o błędzie.

## 11. Kroki implementacji

1.  **Composables**: Implementacja `useGoals` i `useSports` (obsługa API, stan).
2.  **Podstawowe komponenty**: Stworzenie `GoalCard` (wygląd), `ProgressChart` (mock).
3.  **Widok główny**: Implementacja `GoalsView` z `GoalList` i nagłówkiem.
4.  **Formularz**: Implementacja `GoalFormDialog` z logiką walidacji i przełączaniem pól.
5.  **Integracja**: Połączenie widoku z composables i formularzem.
6.  **Routing**: Podpięcie widoku pod `src/pages/index.astro`.
7.  **Testy manualne**: Weryfikacja CRUD i walidacji.

