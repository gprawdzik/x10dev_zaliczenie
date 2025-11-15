# API Endpoint Implementation Plan: Goals

## 1. Przegląd punktu końcowego

Cele (Goals) umożliwiają użytkownikom definiowanie rocznych celów treningowych globalnych lub dla konkretnego sportu. Udostępniamy pełny CRUD wraz z historią zmian, wykonywany w warstwie Supabase z RLS.

Endpointy:
- `GET    /goals` – lista celów z opcjonalnymi filtrami
- `GET    /goals?id=eq.{id}` – pojedynczy cel
- `POST   /goals` – utworzenie
- `PATCH  /goals?id=eq.{id}` – aktualizacja (append-only history)
- `DELETE /goals?id=eq.{id}` – usunięcie
- `GET    /goal_history?goal_id=eq.{goal_id}` – historia zmian jednego celu

## 2. Szczegóły żądania

### 2.1 Lista celów – `GET /goals`
- Query params
  - `year` (int) ‑ opcjonalny
  - `sport_id` (uuid) ‑ opcjonalny
  - `scope_type` (`global | per_sport`) ‑ opcjonalny
  - `metric_type` (`distance | time | elevation_gain`) ‑ opcjonalny
  - Paginacja: `page` (domyślnie 1), `limit` (domyślnie 20, max 100)
  - Sortowanie: `sort_by` (domyślnie created_at), `sort_dir` (`asc|desc`, domyślnie desc)

### 2.2 Pobranie pojedynczego celu – `GET /goals?id=eq.{id}`
Brak dodatkowych parametrów.

### 2.3 Utworzenie celu – `POST /goals`
Body JSON (wymagane pola):
```json
{
  "scope_type": "global",
  "year": 2025,
  "metric_type": "distance",
  "target_value": 2000000,
  "sport_id": null
}
```

### 2.4 Aktualizacja celu – `PATCH /goals?id=eq.{id}`
Body JSON (co najmniej jedno pole):
```json
{
  "metric_type": "distance",
  "target_value": 2200000
}
```

### 2.5 Usunięcie celu – `DELETE /goals?id=eq.{id}`
Brak body.

### 2.6 Historia celu – `GET /goal_history?goal_id=eq.{goal_id}`
- Paginacja identyczna jak w `/goals`.

## 3. Wykorzystywane typy
- DTO (`src/types.ts`): `GoalDto`, `CreateGoalDto`, `UpdateGoalDto`, `GoalHistoryDto`, `Paginated<GoalDto>`
- Enums: `goal_scope_type`, `goal_metric_type`
- Zod schematy (do utworzenia):
  - `createGoalSchema` – dokładnie jak Body POST
  - `updateGoalSchema` – co najmniej jedno pole spośród `metric_type`, `target_value`
  - `goalsQuerySchema` – filtry, paginacja, sortowanie

## 4. Szczegóły odpowiedzi
- 200 OK – kolekcje zwracają `Paginated<GoalDto>` z polami `data,page,limit,total`
- 200 OK – pojedynczy zasób zwraca `GoalDto`
- 201 Created – zwraca nowo utworzony `GoalDto`
- 204 No Content – po udanym DELETE
- 400 Bad Request – niepoprawne dane wejściowe
- 401 Unauthorized – brak/niepoprawny JWT
- 403 Forbidden – naruszenie RLS
- 404 Not Found – brak zasobu
- 409 Conflict – duplikat (np. cel globalny już istnieje dla roku+metric)
- 500 Internal Server Error – niespodziewany błąd

## 5. Przepływ danych
1. Klient → Endpoint Astro API (`src/pages/api/goals.ts`).
2. Endpoint:
   - Pobiera sesję Supabase, weryfikuje JWT.
   - Waliduje query/body przez Zod.
   - Wywołuje warstwę Service (`src/services/goals/…`).
3. Service używa Supabase SDK:
   - Zapytania do widoków `goals`, `goal_history` z filtrami i paginacją.
   - Wstawia/aktualizuje/usuwa rekordy.
4. Supabase RLS zapewnia izolację użytkownika.
5. Przy aktualizacji trigger DB wpisuje rekord w `goal_history`.
6. Service zwraca DTO; endpoint formatuje odpowiedź HTTP.

## 6. Względy bezpieczeństwa
- Wszystkie zapytania wykonywane przy użyciu sesji użytkownika z JWT → RLS.
- Brak możliwości nadpisania `user_id` – dodawane serwerowo po `auth.uid()`.
- Sprawdzenie `content-type: application/json` dla POST/PATCH.
- Limit `limit` ≤ 100 aby zapobiec DOS.
- Supabase filtruje według `user_id`; dodatkowo endpoint sprawdzi istnienie zasobu przed PATCH/DELETE (404 vs 403).

## 7. Obsługa błędów
| Scenariusz | Kod | Komentarz |
|------------|-----|-----------|
| Walidacja Zod nie powiodła się | 400 | zwróć `ErrorDto` z listą błędów |
| Brak JWT / sesji | 401 | przekierowanie do logowania po stronie klienta |
| RLS blokuje operację | 403 | “Forbidden” |
| Cel nie istnieje | 404 | przy GET{id}, PATCH, DELETE |
| Konflikt unikalności | 409 | supabase error code `23505` |
| Inne wyjątki | 500 | log do Sentry, zwróć generyczny komunikat |

## 8. Rozważania dotyczące wydajności
- Paginacja + index `idx_goals_user_year` zapewniają O(log n) skan.
- `select` ogranicza kolumny tylko do potrzebnych pól.
- Batch insert/update ograniczony; normalny ruch niski.
- Cloud-functions/Edge nie używane – jedna runda trip do DB.

## 9. Etapy wdrożenia
1. **DTO & validators**
   - [ ] Dodać `createGoalSchema`, `updateGoalSchema`, `goalsQuerySchema` w `src/validators/goals.ts`.
2. **Service layer**
   - [ ] Utworzyć folder `src/services/goals/` z funkcjami: `listGoals`, `getGoal`, `createGoal`, `updateGoal`, `deleteGoal`, `listGoalHistory`.
3. **Endpoint Astro**
   - [ ] Utworzyć `src/pages/api/goals.ts` z obsługą metod GET/POST/PATCH/DELETE.
   - [ ] Dodać osobny plik `src/pages/api/goal_history.ts` lub rozszerzyć powyższy (GET /goal_history).
4. **DB triggers**
   - [ ] Sprawdzić istnienie triggera w migracjach (`INSERT goal_history` on UPDATE). Jeśli brak → dodać migrację.
5. **Tests**
   - [ ] Vitest: jednostkowe walidatory, mock Supabase.
   - [ ] Cypress e2e: scenariusze CRUD.
6. **Docs & README**
   - [ ] Zaktualizować `docs/…` + OpenAPI generator (opcjonalnie).
7. **CI/CD**
   - [ ] Dodać lint + test job, wdrożenie na mikr.us po merge.

---

> Ten plan należy dostosować do ew. zmian w schemacie DB lub regułach RLS zanim zostanie wdrożony.
