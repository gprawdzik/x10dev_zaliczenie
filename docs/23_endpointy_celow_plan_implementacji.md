Jesteś doświadczonym architektem oprogramowania, którego zadaniem jest stworzenie szczegółowego planu wdrożenia endpointu REST API. Twój plan poprowadzi zespół programistów w skutecznym i poprawnym wdrożeniu tego endpointu.

Zanim zaczniemy, zapoznaj się z poniższymi informacjami:

1. Route API specification:
   <route_api_specification>
   List goals

- Method: GET
- Path: `/goals`
- Query params:
  - `user_id=eq.auth.uid()` is enforced by RLS; clients need not send it
  - Filters: `year=eq.2025`, `sport_id=eq.{uuid}`, `scope_type=eq.global|per_sport`, `metric_type=eq.distance|time|elevation_gain`
  - Pagination/Sorting: `page`, `limit`, `sort_by` (e.g. `created_at`), `sort_dir`
- Response 200 JSON: array of goals

```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "sport_id": null,
    "scope_type": "global",
    "year": 2025,
    "metric_type": "distance",
    "target_value": 2000000,
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

- Errors: 401

Get goal by id

- Method: GET
- Path: `/goals?id=eq.{id}`
- Response 200 JSON: single-element array with goal
- Errors: 401, 404 (if wrapped to enforce existence)

Create goal

- Method: POST
- Path: `/goals`
- Body JSON:

```json
{
  "scope_type": "global",
  "year": 2025,
  "metric_type": "distance",
  "target_value": 2000000,
  "sport_id": null
}
```

- Response: 201 with created row
- Success codes: 201 (created)
- Errors: 400/422 (validation), 401, 409 (conflict if unique policy applied per year/metric), 500

Update goal (append-only history is recorded)

- Method: PATCH
- Path: `/goals?id=eq.{id}`
- Body JSON (partial):

```json
{ "target_value": 2200000, "metric_type": "distance" }
```

- Response: 200 with updated row
- Side effects: a `goal_history` row is inserted with previous values (via DB trigger or Edge Function — see section 4)
- Errors: 400/422, 401, 403 (RLS), 404

Delete goal

- Method: DELETE
- Path: `/goals?id=eq.{id}`
- Response: 204
- Errors: 401, 403, 404

List goal history for a goal

- Method: GET
- Path: `/goal_history?goal_id=eq.{goal_id}`
- Query params: `page`, `limit`, `sort_by=changed_at`, `sort_dir=desc`
- Response 200 JSON: array of entries

```json
[
  {
    "id": "uuid",
    "goal_id": "uuid",
    "previous_metric_type": "distance",
    "previous_target_value": 2000000,
    "changed_at": "2025-02-01T00:00:00Z"
  }
]
```

- Errors: 401, 403

```

- Errors: 401, 422 (invalid overrides), 500
  </route_api_specification>

2. Related database resources:
   <related_db_resources>
   @.ai/db-plan.md
   </related_db_resources>

3. Definicje typów:
   <type_definitions>
   @src/types.ts
   </type_definitions>

4. Tech stack:
   <tech_stack>
   @.ai/tech-stack.md
   </tech_stack>

5. Implementation rules:
   <implementation_rules>
   @shared.mdc, @frondend.mdc, @backend.mdc
   </implementation_rules>

Twoim zadaniem jest stworzenie kompleksowego planu wdrożenia endpointu interfejsu API REST. Przed dostarczeniem ostatecznego planu użyj znaczników <analysis>, aby przeanalizować informacje i nakreślić swoje podejście. W tej analizie upewnij się, że:

1. Podsumuj kluczowe punkty specyfikacji API.
2. Wymień wymagane i opcjonalne parametry ze specyfikacji API.
3. Wymień niezbędne typy DTO i Command Modele.
4. Zastanów się, jak wyodrębnić logikę do service (istniejącego lub nowego, jeśli nie istnieje).
5. Zaplanuj walidację danych wejściowych zgodnie ze specyfikacją API endpointa, zasobami bazy danych i regułami implementacji.
6. Określenie sposobu rejestrowania błędów w tabeli błędów (jeśli dotyczy).
7. Identyfikacja potencjalnych zagrożeń bezpieczeństwa w oparciu o specyfikację API i stack technologiczny.
8. Nakreśl potencjalne scenariusze błędów i odpowiadające im kody stanu.

Po przeprowadzeniu analizy utwórz szczegółowy plan wdrożenia w formacie markdown. Plan powinien zawierać następujące sekcje:

1. Przegląd punktu końcowego
2. Szczegóły żądania
3. Szczegóły odpowiedzi
4. Przepływ danych
5. Względy bezpieczeństwa
6. Obsługa błędów
7. Wydajność
8. Kroki implementacji

W całym planie upewnij się, że

- Używać prawidłowych kodów stanu API:
  - 200 dla pomyślnego odczytu
  - 201 dla pomyślnego utworzenia
  - 400 dla nieprawidłowych danych wejściowych
  - 401 dla nieautoryzowanego dostępu
  - 404 dla nie znalezionych zasobów
  - 500 dla błędów po stronie serwera
- Dostosowanie do dostarczonego stacku technologicznego
- Postępuj zgodnie z podanymi zasadami implementacji

Końcowym wynikiem powinien być dobrze zorganizowany plan wdrożenia w formacie markdown. Oto przykład tego, jak powinny wyglądać dane wyjściowe:

``markdown

# API Endpoint Implementation Plan: [Nazwa punktu końcowego]

## 1. Przegląd punktu końcowego

[Krótki opis celu i funkcjonalności punktu końcowego]

## 2. Szczegóły żądania

- Metoda HTTP: [GET/POST/PUT/DELETE]
- Struktura URL: [wzorzec URL]
- Parametry:
  - Wymagane: [Lista wymaganych parametrów]
  - Opcjonalne: [Lista opcjonalnych parametrów]
- Request Body: [Struktura treści żądania, jeśli dotyczy]

## 3. Wykorzystywane typy

[DTOs i Command Modele niezbędne do implementacji]

## 3. Szczegóły odpowiedzi

[Oczekiwana struktura odpowiedzi i kody statusu]

## 4. Przepływ danych

[Opis przepływu danych, w tym interakcji z zewnętrznymi usługami lub bazami danych]

## 5. Względy bezpieczeństwa

[Szczegóły uwierzytelniania, autoryzacji i walidacji danych]

## 6. Obsługa błędów

[Lista potencjalnych błędów i sposób ich obsługi]

## 7. Rozważania dotyczące wydajności

[Potencjalne wąskie gardła i strategie optymalizacji]

## 8. Etapy wdrożenia

1. [Krok 1]
2. [Krok 2]
3. [Krok 3]
   ...

```

Końcowe wyniki powinny składać się wyłącznie z planu wdrożenia w formacie markdown i nie powinny powielać ani powtarzać żadnej pracy wykonanej w sekcji analizy.

Pamiętaj, aby zapisać swój plan wdrożenia jako .ai/endpoint-implementation-plan-goals.md. Upewnij się, że plan jest szczegółowy, przejrzysty i zapewnia kompleksowe wskazówki dla zespołu programistów.

```

```
