Jako starszy programista frontendu Twoim zadaniem jest stworzenie szczegółowego planu wdrożenia nowego widoku w aplikacji internetowej. Plan ten powinien być kompleksowy i wystarczająco jasny dla innego programisty frontendowego, aby mógł poprawnie i wydajnie wdrożyć widok.

Najpierw przejrzyj następujące informacje:

1. Product Requirements Document (PRD):
   <prd>
   @prd.md
   </prd>

2. Opis widoku:
   <view_description>

- **Dashboard „Moje cele”** (`/`)
  • Cel: Pokazuje bieżący postęp i listę celów  
  • Kluczowe informacje: Wykres kumulatywny, karty celów (plan, wykonanie, %). Na potrzeby mvp. Wykres kumulatywny niech będzie połową założonego celu. Implementacją zajmiemy się później.
  • Kluczowe komponenty: `ProgressChart`, `GoalCard`, `BottomNavBar` / `TopNavBar`, `Toast`, `SkeletonRow`  
  • UX / dostępność / bezpieczeństwo: Lazy loading wykresu, paginacja kart, skeletony, dark-mode
  </view_description>

3. User Stories:
   <user_stories>

- ID: US-006
  Tytuł: Dodanie nowego celu rocznego
  Opis: Użytkownik definiuje nowy cel wybierając zakres, metrykę i wartość.
  Kryteria akceptacji:
  - formularz zawiera pola: scope_type, scope_id, metryka, wartość, rok
  - po zapisie cel pojawia się na liście i wykresie

- ID: US-007
  Tytuł: Edycja istniejącego celu
  Opis: Użytkownik edytuje wartość celu rocznego.
  Kryteria akceptacji:
  - każda edycja tworzy nową wersję celu
  - wykres kumulatywny odzwierciedla nową wartość po zapisie

- ID: US-008
  Tytuł: Usunięcie celu
  Opis: Użytkownik usuwa swój cel.
  Kryteria akceptacji:
  - cel zostaje usunięty z listy i wykresu
    </user_stories>

4. Endpoint Description:
   <endpoint_description>
   List activities

- Method: GET
- Path: `/api/activities`
- Query params: `from` (gte start_date), `to` (lte start_date), `sport_type` (eq), `type` (eq), `page`, `limit`, `sort_by`, `sort_dir`
- Response 200 JSON: array of activities

````json
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
````

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

</endpoint_description>

5. Endpoint Implementation:
   <endpoint_implementation>
   @goals.ts
   </endpoint_implementation>

6. Type Definitions:
   <type_definitions>
   @types.ts
   </type_definitions>

7. Tech Stack:
   <tech_stack>
   @tech-stack.md
   </tech_stack>

Przed utworzeniem ostatecznego planu wdrożenia przeprowadź analizę i planowanie wewnątrz tagów <implementation_breakdown> w swoim bloku myślenia. Ta sekcja może być dość długa, ponieważ ważne jest, aby być dokładnym.

W swoim podziale implementacji wykonaj następujące kroki:

1. Dla każdej sekcji wejściowej (PRD, User Stories, Endpoint Description, Endpoint Implementation, Type Definitions, Tech Stack):

- Podsumuj kluczowe punkty
- Wymień wszelkie wymagania lub ograniczenia
- Zwróć uwagę na wszelkie potencjalne wyzwania lub ważne kwestie

2. Wyodrębnienie i wypisanie kluczowych wymagań z PRD
3. Wypisanie wszystkich potrzebnych głównych komponentów, wraz z krótkim opisem ich opisu, potrzebnych typów, obsługiwanych zdarzeń i warunków walidacji
4. Stworzenie wysokopoziomowego diagramu drzewa komponentów
5. Zidentyfikuj wymagane DTO i niestandardowe typy ViewModel dla każdego komponentu widoku. Szczegółowo wyjaśnij te nowe typy, dzieląc ich pola i powiązane typy.
6. Zidentyfikuj potencjalne zmienne stanu i niestandardowe hooki, wyjaśniając ich cel i sposób ich użycia
7. Wymień wymagane wywołania API i odpowiadające im akcje frontendowe
8. Zmapuj każdej historii użytkownika do konkretnych szczegółów implementacji, komponentów lub funkcji
9. Wymień interakcje użytkownika i ich oczekiwane wyniki
10. Wymień warunki wymagane przez API i jak je weryfikować na poziomie komponentów
11. Zidentyfikuj potencjalne scenariusze błędów i zasugeruj, jak sobie z nimi poradzić
12. Wymień potencjalne wyzwania związane z wdrożeniem tego widoku i zasugeruj możliwe rozwiązania

Po przeprowadzeniu analizy dostarcz plan wdrożenia w formacie Markdown z następującymi sekcjami:

1. Przegląd: Krótkie podsumowanie widoku i jego celu.
2. Routing widoku: Określenie ścieżki, na której widok powinien być dostępny.
3. Struktura komponentów: Zarys głównych komponentów i ich hierarchii.
4. Szczegóły komponentu: Dla każdego komponentu należy opisać:

- Opis komponentu, jego przeznaczenie i z czego się składa
- Główne elementy HTML i komponenty dzieci, które budują komponent
- Obsługiwane zdarzenia
- Warunki walidacji (szczegółowe warunki, zgodnie z API)
- Typy (DTO i ViewModel) wymagane przez komponent
- Propsy, które komponent przyjmuje od rodzica (interfejs komponentu)

5. Typy: Szczegółowy opis typów wymaganych do implementacji widoku, w tym dokładny podział wszelkich nowych typów lub modeli widoku według pól i typów.
6. Zarządzanie stanem: Szczegółowy opis sposobu zarządzania stanem w widoku, określenie, czy wymagany jest customowy hook.
7. Integracja API: Wyjaśnienie sposobu integracji z dostarczonym punktem końcowym. Precyzyjnie wskazuje typy żądania i odpowiedzi.
8. Interakcje użytkownika: Szczegółowy opis interakcji użytkownika i sposobu ich obsługi.
9. Warunki i walidacja: Opisz jakie warunki są weryfikowane przez interfejs, których komponentów dotyczą i jak wpływają one na stan interfejsu
10. Obsługa błędów: Opis sposobu obsługi potencjalnych błędów lub przypadków brzegowych.
11. Kroki implementacji: Przewodnik krok po kroku dotyczący implementacji widoku.

Upewnij się, że Twój plan jest zgodny z PRD, historyjkami użytkownika i uwzględnia dostarczony stack technologiczny.

Ostateczne wyniki powinny być w języku polskim i zapisane w pliku o nazwie .ai/view-{view-name}-implementation-plan.md. Nie uwzględniaj żadnej analizy i planowania w końcowym wyniku.

Oto przykład tego, jak powinien wyglądać plik wyjściowy (treść jest do zastąpienia):

```markdown
# Plan implementacji widoku [Nazwa widoku]

## 1. Przegląd

[Krótki opis widoku i jego celu]

## 2. Routing widoku

[Ścieżka, na której widok powinien być dostępny]

## 3. Struktura komponentów

[Zarys głównych komponentów i ich hierarchii]

## 4. Szczegóły komponentów

### [Nazwa komponentu 1]

- Opis komponentu [opis]
- Główne elementy: [opis]
- Obsługiwane interakcje: [lista]
- Obsługiwana walidacja: [lista, szczegółowa]
- Typy: [lista]
- Propsy: [lista]

### [Nazwa komponentu 2]

[...]

## 5. Typy

[Szczegółowy opis wymaganych typów]

## 6. Zarządzanie stanem

[Opis zarządzania stanem w widoku]

## 7. Integracja API

[Wyjaśnienie integracji z dostarczonym endpointem, wskazanie typów żądania i odpowiedzi]

## 8. Interakcje użytkownika

[Szczegółowy opis interakcji użytkownika]

## 9. Warunki i walidacja

[Szczegółowy opis warunków i ich walidacji]

## 10. Obsługa błędów

[Opis obsługi potencjalnych błędów]

## 11. Kroki implementacji

1. [Krok 1]
2. [Krok 2]
3. [...]
```

Rozpocznij analizę i planowanie już teraz. Twój ostateczny wynik powinien składać się wyłącznie z planu wdrożenia w języku polskim w formacie markdown, który zapiszesz w pliku .ai/view-goals-implementation-plan.md i nie powinien powielać ani powtarzać żadnej pracy wykonanej w podziale implementacji.
