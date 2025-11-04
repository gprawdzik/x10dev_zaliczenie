# API Endpoint Implementation Plan: Create Sport

## 1. Przegląd punktu końcowego

Endpoint umożliwia dodanie nowego sportu do słownika `sports`. Operacja jest dostępna wyłącznie dla administratora (MVP – można pominąć w UI, ale endpoint ma istnieć). Po pomyślnym utworzeniu zwraca pełny rekord sportu.

| Właściwość  | Wartość                                                                                               |
| ----------- | ----------------------------------------------------------------------------------------------------- |
| HTTP Method | **POST**                                                                                              |
| URL         | `/api/sports`                                                                                         |
| AuthN/AuthZ | Supabase JWT ‑ wymagany; rola `authenticated` + claim `role = admin` lub bypass RLS (`service_role`). |

---

## 2. Szczegóły żądania

- Format: `Content-Type: application/json`

```json
{
  "code": "run",
  "name": "Running",
  "description": "optional"
}
```

| Pole          | Typ    | Wymagane | Walidacja                           |
| ------------- | ------ | -------- | ----------------------------------- |
| `code`        | string | ✅       | min 1; max 32; snake-case; unikalne |
| `name`        | string | ✅       | min 1; max 64                       |
| `description` | string | ❌       | max 255                             |

---

## 3. Szczegóły odpowiedzi

Status `201 Created`

```jsonc
{
  "id": "uuid",
  "code": "run",
  "name": "Running",
  "description": "optional",
  "consolidated": null,
}
```

### Kody statusu i błędy

| Kod | Opis                                   |
| --- | -------------------------------------- |
| 201 | Sport utworzony poprawnie              |
| 400 | Niepoprawne dane wejściowe (walidacja) |
| 401 | Brak uwierzytelnienia                  |
| 403 | Brak uprawnień (RLS)                   |
| 409 | `code` już istnieje                    |
| 500 | Błąd serwera/Supabase                  |

---

## 4. Wykorzystywane typy

- `CreateSportDto` – `Omit<TablesInsert<"sports">, "id">`
- `SportDto` – `Tables<"sports">`
- `ErrorDto` – wspólny format błędów
- `CreateSportCommand` (wewnętrzny model use-case)

---

## 5. Przepływ danych

1. Klient wysyła `POST /api/sports` z jsonem.
2. Astro Server Endpoint (`src/pages/api/sports.ts`) odbiera żądanie.
3. Funkcja `parseBody()` + schemat Zod waliduje wejście → `CreateSportCommand`.
4. Service `createSport(command)` wykonuje:
   1. Próba inserta do tabeli `sports` poprzez `supabaseAdmin` (service_role) lub `supabase` w kontekście RLS.
   2. Obsługa błędu unikalności (`code`) → 409.
5. Zwróć `201` + utworzony rekord (`SportDto`).
6. Loguj błędy do sentry/console – w przyszłości tabela `api_errors`.

---

## 6. Względy bezpieczeństwa

- Wymagane JWT – endpoint zamknięty.
- Sanitizacja stringów (Astro allerede używa pg-bindings; sql-inj niegroźny).
- Limit rate-limiting (middleware globalne) – ochrona przed spamem.

---

## 7. Obsługa błędów

| Scenariusz                   | Kod | Body (`ErrorDto`) |
| ---------------------------- | --- | ----------------- |
| Niepoprawne JSON / walidacja | 400 | `invalid_input`   |
| Brak tokena                  | 401 | `unauthorized`    |
| Brak roli admin              | 403 | `forbidden`       |
| Unikalne `code`              | 409 | `duplicate_code`  |
| Inne                         | 500 | `internal_error`  |

---

## 8. Rozważania dotyczące wydajności

- Pojedynczy insert → niski koszt.
- Indeks unikalny na `code` już istnieje.
- Brak zapytań złożonych.

---

## 9. Etapy wdrożenia

1. **Typy & walidacja**
   - [ ] Dodaj `CreateSportCommand` i schemat Zod (`src/validators/createSport.ts`).
2. **Middleware auth**
   - [ ] Zaimplementuj lub użyj istniejącego `ensureAdmin()` w `src/middleware`.
3. **Service**
   - [ ] Stwórz folder `src/services/sports/` → `createSport.ts` z logiką inserta.
4. **Endpoint**
   - [ ] Utwórz `src/pages/api/sports.ts`:
     - parse + validate, wywołaj service, mapuj błędy.
5. **RLS**
   - [ ] Dodaj migrację SQL: policy insert tylko dla roli admin.
6. **Testy**
   - [ ] Vitest – test walidacji i service z mock Supabase.
7. **Dokumentacja**
   - [ ] Aktualizuj `README` / OpenAPI spec.
8. **CI/CD**
   - [ ] Dodaj krok lint + test w GitHub Actions.

---

> Gotowe! Endpoint będzie zgodny z architekturą Astro Islands i Supabase oraz standardami projektu.
