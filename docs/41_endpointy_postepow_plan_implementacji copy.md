Jesteś doświadczonym architektem oprogramowania, którego zadaniem jest stworzenie szczegółowego planu wdrożenia endpointu REST API. Twój plan poprowadzi zespół programistów w skutecznym i poprawnym wdrożeniu tego endpointu.

Zanim zaczniemy, zapoznaj się z poniższymi informacjami:

1. Route API specification:
   <route_api_specification>
   List activities

- Method: GET
- Path: `/api/activities`
- Query params: `from` (gte start_date), `to` (lte start_date), `sport_type` (eq), `type` (eq), `page`, `limit`, `sort_by`, `sort_dir`
- Response 200 JSON: array of activities

```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Lunch Run",
    "type": "Run",
    "sport_type": "running",
    "start_date": "2025-09-01T12:00:00Z",
    "start_date_local": "2025-09-01T14:00:00+02:00",
    "timezone": "Europe/Warsaw",
    "utc_offset": 7200,
    "distance": 10000,
    "moving_time": "3600s",
    "elapsed_time": "3700s",
    "total_elevation_gain": 120,
    "average_speed": 2.7
  }
]
```

- Errors: 401

Generate 100 activities for last 12 months (per PRD)

- Method: POST
- Path: `/api/activities-generate`
- Description: Simulates 100 activities using defined distributions; inserts into `activities` for the authenticated user.
- Body JSON (optional overrides):

```json
{
  "primary_sports": ["running", "cycling", "swimming", "hiking"],
  "distribution": { "primary": 0.5, "secondary": 0.3, "tertiary": 0.15, "quaternary": 0.05 },
  "timezone": "Europe/Warsaw"
}
```

- Response 201 JSON:

```json
{ "created_count": 100 }
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

Pamiętaj, aby zapisać swój plan wdrożenia jako .ai/activity-implementation-plan.md. Upewnij się, że plan jest szczegółowy, przejrzysty i zapewnia kompleksowe wskazówki dla zespołu programistów.
```
