# Zmiany w Autentykacji dla API Sports

## Podsumowanie

Wprowadzono wymaganie autentykacji dla operacji tworzenia sportów (POST `/api/sports`), podczas gdy odczyt sportów (GET `/api/sports`) pozostaje dostępny publicznie. Zmiany zapewniają zgodność z politykami RLS w bazie danych.

## Zmiany w Kodzie

### 1. Service: `src/services/sports/createSport.ts`

**Przed:**
```typescript
export async function createSport(command: CreateSportCommand): Promise<SportDto> {
  const client = supabaseClient; // Używał globalnego klienta z anon key
  // ...
}
```

**Po:**
```typescript
export async function createSport(
  client: SupabaseClient<Database>, 
  command: CreateSportCommand
): Promise<SportDto> {
  // Przyjmuje klienta jako parametr
  // ...
}
```

**Zmienione:**
- Dodano parametr `client: SupabaseClient<Database>` jako pierwszy parametr funkcji
- Usunięto import `supabaseClient`
- Dodano import typów: `SupabaseClient` i `Database`
- Zaktualizowano dokumentację JSDoc

### 2. API Endpoint: `src/pages/api/sports.ts`

**Dodano:**
- Import `requireAuth` i `AuthError` z `../../middleware/requireAuth.js`
- Weryfikację autentykacji w handlerze POST

**Zmieniony handler POST:**
```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Verify authentication
    try {
      await requireAuth(request, { supabase: locals.supabase });
    } catch (error) {
      if (error instanceof AuthError) {
        return errorResponse(401, error.code, error.message, error.details);
      }
      throw error;
    }

    // Step 2: Parse and validate request body
    let command: CreateSportCommand;
    // ... walidacja ...

    // Step 3: Execute business logic - create sport using authenticated client
    let sport: SportDto;
    sport = await createSport(locals.supabase, command); // Przekazanie authenticated client
    
    // Step 4: Return success response
    // ...
  }
};
```

**Handler GET** - pozostaje bez zmian (publiczny dostęp).

### 3. Middleware: `src/middleware/index.ts`

**Zmiana:**
```typescript
const protectedRoutes = [
  '/',
  '/settings',
  '/goals',
  '/activities',
  '/progress',
  // '/api/sports', // USUNIĘTE - RLS policies zarządzają dostępem
  '/api/goals',
  '/api/activities',
  '/api/activities-generate',
  '/api/goal_history',
]
```

**Uzasadnienie:**
- Usunięto `/api/sports` z `protectedRoutes`
- Umożliwia to publiczny dostęp do GET, podczas gdy POST jest chroniony przez `requireAuth`
- RLS policies w bazie danych zapewniają granularną kontrolę dostępu

## Jak to Działa

### Flow dla Niezalogowanego Użytkownika

#### GET /api/sports (Odczyt - Dozwolone ✅)
```
1. Request: GET /api/sports
2. Middleware: Przepuszcza (nie ma w protectedRoutes)
3. Handler: Wywołuje getSports()
4. Supabase: RLS policy "sports_select_anon" pozwala na SELECT
5. Response: 200 OK z listą sportów
```

#### POST /api/sports (Tworzenie - Zabronione ❌)
```
1. Request: POST /api/sports + body
2. Middleware: Przepuszcza (nie ma w protectedRoutes)
3. Handler: Wywołuje requireAuth()
4. requireAuth: Brak tokenu → AuthError (MISSING_TOKEN)
5. Response: 401 Unauthorized
```

### Flow dla Zalogowanego Użytkownika

#### POST /api/sports (Tworzenie - Dozwolone ✅)
```
1. Request: POST /api/sports + body + Authorization header/cookies
2. Middleware: Przepuszcza i tworzy locals.supabase z sesją użytkownika
3. Handler: 
   a. Wywołuje requireAuth(request, { supabase: locals.supabase })
   b. requireAuth zwraca { userId, user, accessToken }
   c. Wywołuje createSport(locals.supabase, command)
4. Supabase: 
   a. locals.supabase ma token użytkownika
   b. RLS policy "sports_insert_authenticated" sprawdza auth.uid()
   c. Pozwala na INSERT dla authenticated role
5. Response: 201 Created z nowym sportem
```

## Polityki RLS (z migracji)

### Dla Niezalogowanych (anon):
```sql
-- Tylko odczyt
create policy sports_select_anon on sports
  for select
  to anon
  using (true);
```

### Dla Zalogowanych (authenticated):
```sql
-- Odczyt
create policy sports_select_authenticated on sports
  for select
  to authenticated
  using (true);

-- Zapis
create policy sports_insert_authenticated on sports
  for insert
  to authenticated
  with check (true);

-- Aktualizacja
create policy sports_update_authenticated on sports
  for update
  to authenticated
  using (true)
  with check (true);

-- Usuwanie
create policy sports_delete_authenticated on sports
  for delete
  to authenticated
  using (true);
```

## Testowanie

### Test 1: GET bez autentykacji (Powinien działać ✅)
```bash
curl http://localhost:4321/api/sports
```

**Oczekiwany wynik:** 200 OK z listą sportów

### Test 2: POST bez autentykacji (Powinien zwrócić błąd ❌)
```bash
curl -X POST http://localhost:4321/api/sports \
  -H "Content-Type: application/json" \
  -d '{"code":"RUN","name":"Running","description":"Running activities"}'
```

**Oczekiwany wynik:** 401 Unauthorized
```json
{
  "error": {
    "code": "MISSING_TOKEN",
    "message": "Access token is required for this operation"
  }
}
```

### Test 3: POST z autentykacją (Powinien działać ✅)
```bash
# Najpierw zaloguj się i uzyskaj token
curl -X POST http://localhost:4321/api/sports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"code":"RUN","name":"Running","description":"Running activities"}'
```

**Oczekiwany wynik:** 201 Created
```json
{
  "id": "uuid",
  "code": "RUN",
  "name": "Running",
  "description": "Running activities",
  "consolidated": null
}
```

### Test 4: E2E przez przeglądarkę
1. Otwórz aplikację w przeglądarce
2. Spróbuj otworzyć stronę ze sportami (jeśli istnieje) - powinna być dostępna
3. Zaloguj się
4. Spróbuj utworzyć nowy sport przez formularz
5. Powinno się powieść

## Bezpieczeństwo

### Zabezpieczenia na Poziomie Aplikacji:
- ✅ `requireAuth` weryfikuje token JWT przed dostępem do POST
- ✅ Token jest weryfikowany przez Supabase Auth
- ✅ Authenticated client (`locals.supabase`) ma dostęp tylko do zasobów zalogowanego użytkownika

### Zabezpieczenia na Poziomie Bazy Danych:
- ✅ RLS policies wymuszają uprawnienia nawet jeśli kod aplikacji ma błąd
- ✅ Niezalogowani użytkownicy (anon) mogą tylko czytać
- ✅ Zalogowani użytkownicy (authenticated) mogą wykonywać wszystkie operacje CRUD

### Obrona w Głąb (Defense in Depth):
1. **Warstwa 1:** Middleware może opcjonalnie blokować dostęp do tras
2. **Warstwa 2:** `requireAuth` weryfikuje autentykację w handlerze API
3. **Warstwa 3:** RLS policies w bazie danych wymuszają uprawnienia
4. **Warstwa 4:** Walidacja danych wejściowych (Zod schemas)

## Zgodność z Architekturą

Zmiany są zgodne z istniejącą architekturą projektu:
- Wzorzec używany w `/api/goals.ts` i `/api/activities.ts`
- Wykorzystanie `requireAuth` z `locals.supabase`
- Separacja warstw (service, API, middleware)
- RLS jako główny mechanizm bezpieczeństwa

## Możliwe Rozszerzenia

### 1. Role-Based Access Control (RBAC)
Dodanie ról użytkowników (np. admin, user) i ograniczenie tworzenia sportów tylko do adminów:

```sql
-- Dodaj kolumnę role do auth.users lub stwórz tabelę user_roles
create policy sports_insert_admin_only on sports
  for insert
  to authenticated
  with check (
    exists (
      select 1 from user_roles
      where user_id = auth.uid()
        and role = 'admin'
    )
  );
```

### 2. Audit Trail
Dodanie logowania kto i kiedy utworzył/zmodyfikował sport:

```sql
alter table sports add column created_by uuid references auth.users(id);
alter table sports add column created_at timestamp default now();
alter table sports add column updated_by uuid references auth.users(id);
alter table sports add column updated_at timestamp default now();
```

### 3. Rate Limiting
Dodanie limitu liczby sportów, które użytkownik może utworzyć:

```typescript
// W createSport service
const { count } = await client
  .from('sports')
  .select('*', { count: 'exact', head: true })
  .eq('created_by', userId);

if (count && count >= MAX_SPORTS_PER_USER) {
  throw new SportCreationError(
    SportCreationErrors.LIMIT_EXCEEDED,
    'You have reached the maximum number of sports'
  );
}
```

## Podsumowanie

Zmiany zapewniają, że:
- ✅ Tylko zalogowani użytkownicy mogą tworzyć sporty (POST)
- ✅ Każdy może odczytywać listę sportów (GET)
- ✅ RLS policies w bazie danych są przestrzegane
- ✅ Kod jest zgodny z istniejącą architekturą projektu
- ✅ Bezpieczeństwo jest zapewnione na wielu warstwach

