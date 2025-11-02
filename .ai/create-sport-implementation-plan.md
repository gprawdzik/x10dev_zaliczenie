# API Endpoint Implementation Plan: Create Sport

## 1. Przegląd punktu końcowego

Endpoint `POST /sports` umożliwia administratorowi dodanie nowego sportu do systemu. Sport jest bytem referencyjnym wykorzystywanym w celach (goals) oraz statystykach aktywności, dlatego poprawne i spójne tworzenie rekordów w tabeli `sports` ma krytyczne znaczenie dla integralności danych.

## 2. Szczegóły żądania

- **Metoda HTTP:** `POST`
- **URL:** `/sports`
- **Nagłówki wymagane:**
  - `Authorization: Bearer <jwt>` – token Supabase z uprawnieniem `role = admin`
  - `Content-Type: application/json`
- **Parametry URL:** brak
- **Body (JSON):**
  ```json
  {
    "code": "run", // wymagane, unikalny kod URL-safe
    "name": "Running", // wymagane, przyjazna nazwa
    "description": "optional", // opcjonalny opis
    "consolidated": null // opcjonalny JSONB określający konwersję typów
  }
  ```
- **Walidacja pól:**
  | Pole | Typ | Ograniczenia |
  |---------------|--------------------|-------------------------------------------------------------|
  | `code` | `string` | 1–32 znaków, `[a-z0-9_\-]`, unikalne w tabeli `sports` |
  | `name` | `string` | 1–64 znaków |
  | `description` | `string \| null` | ≤ 256 znaków |
  | `consolidated`| `object \| null` | dowolny JSON; `null` jeśli brak danych |

## 3. Wykorzystywane typy

- **DTO (frontend/backend shareable):**
  - `CreateSportDto` – już zdefiniowany w `src/types.ts` jako `Omit<TablesInsert<"sports">, "id">`.
- **Model domenowy (backend):**
  ```ts
  type Sport = {
    id: string
    code: string
    name: string
    description?: string | null
    consolidated?: Record<string, unknown> | null
  }
  ```
- **Command Model:** `CreateSportCommand` (jeśli stosujemy CQRS) z polami identycznymi jak `CreateSportDto`.

## 4. Szczegóły odpowiedzi

| Kod | Znaczenie                          | Treść                         |
| --- | ---------------------------------- | ----------------------------- |
| 201 | Sport utworzony pomyślnie          | `{ ...Sport }` – pełny rekord |
| 400 | Nieprawidłowe dane wejściowe       | `ErrorDto`                    |
| 401 | Brak uwierzytelnienia              | `ErrorDto`                    |
| 403 | Brak autoryzacji (RLS)             | `ErrorDto`                    |
| 409 | Duplikat `code` (unique violation) | `ErrorDto`                    |
| 500 | Błąd serwera                       | `ErrorDto`                    |

## 5. Przepływ danych

1. Klient (panel admina) wysyła `POST /sports` z danymi.
2. Supabase Edge Function (lub bezpośrednie żądanie do Supabase REST) odbiera zapytanie.
3. Funkcja:
   1. Waliduje JSON (Zod / io-ts).
   2. Sprawdza uprawnienia użytkownika (rola `admin`).
   3. Próbuje wstawić rekord do tabeli `sports`.
   4. W przypadku sukcesu zwraca `201` z rekordem.
4. Baza danych uruchamia constraint UNIQUE na `code`; w razie konfliktu zwraca `409`.

> Uwaga: przy Supabase bez custom function można użyć wbudowanego endpointu `POST /rest/v1/sports`; jednak Edge Function daje większą kontrolę nad walidacją i logiką.

## 6. Względy bezpieczeństwa

- **Auth:** JWT Supabase; sprawdzenie `auth.role = 'authenticated'` oraz claimu `role = 'admin'`.
- **RLS:** tabela `sports` ma domyślnie `select` dla wszystkich; dla `insert` tylko rola `service_role` lub użytkownicy z policy `is_admin()`.
- **Validation hardening:** odrzuć pola nieznane (`stripUnknown`).
- **Input sanitization:** wymuszenie regex na `code`, ograniczenia długości na `name` / `description`.
- **Rate limiting:** ewentualnie Cloudflare / Supabase Edge dla endpointów admin.
- **Audit log:** opcjonalnie trigger `INSERT` do tabeli `audit_log`.

## 7. Obsługa błędów

| Scenariusz                       | Kod | Akcja                                                   |
| -------------------------------- | --- | ------------------------------------------------------- |
| Brak/niepoprawny JWT             | 401 | Zwróć `ErrorDto { code: 'auth_failed' }`                |
| Brak roli admin                  | 403 | `ErrorDto { code: 'forbidden' }`                        |
| Niewłaściwy `code`, `name`, itp. | 400 | `ErrorDto { code: 'validation_error', details: {...} }` |
| Duplikat `code`                  | 409 | `ErrorDto { code: 'duplicate_code' }`                   |
| Błąd bazy (inne)                 | 500 | `ErrorDto { code: 'internal_error' }`                   |

## 8. Rozważania dotyczące wydajności

- Operacja jednotabelowa → koszt minimalny.
- Indeks UNIQUE na `code` zabezpiecza przed O(N) scanem.
- Edge Function cold-start < 100 ms; nieistotne przy ruchu admin.

## 9. Etapy wdrożenia

1. **Przygotowanie bazy**
   - Sprawdź czy tabela `sports` istnieje (jest w migration `20251102120000_initial_schema.sql`).
   - Dodaj policy RLS `allow insert for role = admin`.
2. **Walidacja schematu**
   - Utwórz schemat Zod `createSportSchema`.
3. **Edge Function** `create_sport.ts`
   - Setup Supabase client with `service_role` key (secure env var).
   - Implement logic: parse → validate → insert → return.
4. **Integracja Frontend (panel admin)**
   - Formularz + hook `useCreateSport` (vue-query).

---

> Plan przygotowano z uwzględnieniem stosu technologicznego: Vue 3 + TypeScript 5, Supabase, Openrouter.ai, Tailwind 4 oraz wytycznych Clean Architecture.
