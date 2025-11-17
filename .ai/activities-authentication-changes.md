# Zmiany w Autentykacji dla API Activities

## Podsumowanie

Wprowadzono poprawki zapewniające, że wszystkie endpointy activities używają authenticated Supabase client zamiast globalnego klienta z anon key. Activities są zawsze prywatnymi danymi użytkownika, więc wszystkie operacje wymagają autentykacji.

## Różnice między Sports i Activities

### Sports (Dane Publiczne)
- **GET**: Dostępne publicznie (rola `anon` + `authenticated`)
- **POST/PUT/DELETE**: Tylko dla zalogowanych (rola `authenticated`)
- **RLS Policies**: Zezwalają na SELECT dla `anon`

### Activities (Dane Prywatne)
- **GET/POST/PUT/DELETE**: Tylko dla zalogowanych (rola `authenticated`)
- **Izolacja danych**: Użytkownik widzi TYLKO swoje activities (`user_id = auth.uid()`)
- **RLS Policies**: NIE MA policy dla `anon` - brak publicznego dostępu

## Zmiany w Kodzie

### 1. Endpoint: `src/pages/api/activities.ts`

**Przed:**
```typescript
const paginatedActivities = await listActivities(userId, params);
```

**Po:**
```typescript
const paginatedActivities = await listActivities(userId, params, { supabase: locals.supabase });
```

**Zmiana:** Przekazanie authenticated client do serwisu `listActivities`.

### 2. Endpoint: `src/pages/api/activities-generate.ts`

**Przed:**
```typescript
const result = await generateActivities(userId, selectedSports, overrides);
```

**Po:**
```typescript
const result = await generateActivities(userId, selectedSports, overrides, { supabase: locals.supabase });
```

**Zmiana:** Przekazanie authenticated client do serwisu `generateActivities`.

### 3. Service: `src/services/activities.ts`

**Przed zmiany:** Funkcje `listActivities` i `generateActivities` już przyjmowały opcjonalny parametr `options?: { supabase?: ActivitiesSupabaseClient }`, ale endpointy go nie przekazywały.

**Po zmianach:** Endpointy teraz poprawnie przekazują authenticated client, więc serwisy używają `locals.supabase` zamiast globalnego `supabaseClient`.

### 4. Middleware: `src/middleware/index.ts`

**Bez zmian** - `/api/activities` i `/api/activities-generate` już były w `protectedRoutes`, co jest poprawne.

## RLS Policies (z migracji)

### Dla Activities - TYLKO authenticated:

```sql
-- SELECT: Tylko własne activities
create policy activities_select_authenticated on activities
  for select
  to authenticated
  using (user_id = auth.uid());

-- INSERT: Tylko własne activities
create policy activities_insert_authenticated on activities
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- UPDATE: Tylko własne activities
create policy activities_update_authenticated on activities
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- DELETE: Tylko własne activities
create policy activities_delete_authenticated on activities
  for delete
  to authenticated
  using (user_id = auth.uid());
```

**Kluczowe punkty:**
- ❌ BRAK policy dla roli `anon` - niezalogowani użytkownicy w ogóle nie mają dostępu
- ✅ Wszystkie operacje tylko dla `authenticated`
- ✅ Warunek `user_id = auth.uid()` zapewnia izolację danych między użytkownikami

## Jak to Działa

### Flow dla Niezalogowanego Użytkownika

#### GET /api/activities (Zabronione ❌)
```
1. Request: GET /api/activities
2. Middleware: pathname="/api/activities" in protectedRoutes
3. Middleware: !session → redirect to /auth/login
4. Response: 302 Redirect to login page
```

**Alternatywnie, jeśli middleware zostanie ominięty:**
```
1. Request: GET /api/activities (bez tokenu)
2. Handler: Wywołuje requireAuth()
3. requireAuth: Brak tokenu → AuthError (MISSING_TOKEN)
4. Response: 401 Unauthorized
```

### Flow dla Zalogowanego Użytkownika

#### GET /api/activities (Dozwolone ✅)
```
1. Request: GET /api/activities + cookies/Authorization header
2. Middleware: 
   a. Sprawdza sesję z cookies
   b. session exists → przepuszcza
   c. Tworzy locals.supabase z sesją użytkownika
3. Handler:
   a. Wywołuje requireAuth(request, { supabase: locals.supabase })
   b. requireAuth weryfikuje token i zwraca userId
   c. Wywołuje listActivities(userId, params, { supabase: locals.supabase })
4. Service:
   a. Używa przekazanego locals.supabase (ma token użytkownika)
   b. Query: SELECT * FROM activities WHERE user_id = userId
5. Supabase:
   a. RLS policy sprawdza: user_id = auth.uid()
   b. Token w locals.supabase zawiera auth.uid()
   c. Warunek spełniony → zwraca activities użytkownika
6. Response: 200 OK z activities użytkownika
```

#### POST /api/activities-generate (Dozwolone ✅)
```
1. Request: POST /api/activities-generate + body + cookies/Authorization
2. Middleware: session exists → przepuszcza
3. Handler:
   a. Wywołuje requireAuth() → userId
   b. Waliduje payload
   c. Wywołuje generateActivities(userId, sports, overrides, { supabase: locals.supabase })
4. Service:
   a. Generuje synthetic activities z userId
   b. INSERT INTO activities (..., user_id: userId)
5. Supabase:
   a. RLS policy sprawdza: user_id = auth.uid()
   b. userId w INSERT = auth.uid() z tokena
   c. Warunek spełniony → INSERT succeeds
6. Response: 201 Created
```

## Problem Rozwiązany

### Przed Zmianami:
```typescript
// Endpoint przekazywał userId ale NIE authenticated client
const paginatedActivities = await listActivities(userId, params);

// Service używał GLOBALNEGO supabaseClient z anon key
const client = options?.supabase ?? supabaseClient; // ❌ anon key

// Query:
SELECT * FROM activities WHERE user_id = 'user-123'

// RLS Policy check:
// - Client ma anon key (nie ma auth.uid())
// - Policy wymaga: user_id = auth.uid()
// - auth.uid() = null dla anon
// - Warunek NIE spełniony → 0 wyników lub błąd
```

### Po Zmianach:
```typescript
// Endpoint przekazuje authenticated client
const paginatedActivities = await listActivities(userId, params, { supabase: locals.supabase });

// Service używa AUTHENTICATED client
const client = options?.supabase ?? supabaseClient; // ✅ locals.supabase z tokenem

// Query:
SELECT * FROM activities WHERE user_id = 'user-123'

// RLS Policy check:
// - Client ma access token użytkownika
// - Policy wymaga: user_id = auth.uid()
// - auth.uid() = 'user-123' z tokena
// - Warunek spełniony → zwraca activities
```

## Warstwy Bezpieczeństwa (Defense in Depth)

Activities mają **3 warstwy bezpieczeństwa**:

### Warstwa 1: Middleware (Opcjonalna)
```typescript
// src/middleware/index.ts
const protectedRoutes = ['/api/activities', '/api/activities-generate'];

if (!session && isProtected(pathname)) {
  return redirect('/auth/login');
}
```
- Sprawdza sesję przed dostępem do endpointu
- Przekierowuje niezalogowanych na login page
- Tworzy `locals.supabase` z sesją użytkownika

### Warstwa 2: requireAuth w Endpointach (Wymagana)
```typescript
const { userId } = await requireAuth(request, { supabase: locals.supabase });
```
- Weryfikuje JWT token
- Sprawdza ważność tokenu przez Supabase Auth
- Zwraca `userId` do użycia w query
- Rzuca `AuthError` jeśli token nieprawidłowy lub wygasł

### Warstwa 3: RLS Policies w Bazie (Wymagana)
```sql
create policy activities_select_authenticated on activities
  for select
  to authenticated
  using (user_id = auth.uid());
```
- Wymusza izolację danych na poziomie bazy
- Sprawdza `user_id = auth.uid()` dla KAŻDEGO query
- Działa nawet jeśli kod aplikacji ma błąd
- Nie można jej obejść z poziomu aplikacji

## Testowanie

### Test 1: GET bez autentykacji (Powinien być zablokowany ❌)

**Przez przeglądarkę:**
```bash
# Otwórz incognito
curl http://localhost:4321/api/activities
```

**Oczekiwany wynik:** 302 Redirect do `/auth/login`

**Przez API z Bearer token:**
```bash
curl http://localhost:4321/api/activities
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

### Test 2: GET z autentykacją (Powinien działać ✅)

```bash
# Najpierw zaloguj się i uzyskaj token
curl http://localhost:4321/api/activities \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Oczekiwany wynik:** 200 OK
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "user-123",
      "name": "Morning Run",
      "sport_type": "Run",
      "distance": 5000,
      ...
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 42
}
```

### Test 3: POST generate activities (Powinien działać ✅)

```bash
curl -X POST http://localhost:4321/api/activities-generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "primary_sports": ["Run", "Ride"],
    "total": 50
  }'
```

**Oczekiwany wynik:** 201 Created
```json
{
  "created_count": 50
}
```

### Test 4: Izolacja danych między użytkownikami

**Scenariusz:**
1. User A loguje się i tworzy activities
2. User B loguje się
3. User B próbuje pobrać activities

**Oczekiwany wynik:** User B widzi TYLKO swoje activities, nie widzi activities User A (dzięki RLS policy `user_id = auth.uid()`)

## Zgodność z Architekturą

Zmiany są zgodne z istniejącą architekturą projektu:
- ✅ Wzorzec używany w `/api/goals.ts` i innych endpointach
- ✅ Wykorzystanie `requireAuth` z `locals.supabase`
- ✅ Przekazanie authenticated client do serwisów przez opcjonalny parametr
- ✅ Separacja warstw (endpoint → service → database)
- ✅ RLS jako główny mechanizm bezpieczeństwa

## Porównanie: Sports vs Activities

| Aspekt | Sports | Activities |
|--------|--------|-----------|
| **Natura danych** | Publiczne (katalog sportów) | Prywatne (dane użytkownika) |
| **GET bez auth** | ✅ Dozwolone (anon może czytać) | ❌ Zabronione (brak policy dla anon) |
| **POST bez auth** | ❌ Zabronione (wymaga authenticated) | ❌ Zabronione (wymaga authenticated) |
| **RLS policy dla anon** | ✅ Tak (sports_select_anon) | ❌ Nie |
| **Izolacja danych** | ❌ Nie (wszystkie sporty dla wszystkich) | ✅ Tak (user_id = auth.uid()) |
| **Middleware protection** | ❌ Nie (usunięto z protectedRoutes) | ✅ Tak (w protectedRoutes) |
| **requireAuth w GET** | ❌ Nie (publiczny dostęp) | ✅ Tak (wymaga tokenu) |
| **requireAuth w POST** | ✅ Tak (tylko zalogowani) | ✅ Tak (tylko zalogowani) |

## Potencjalne Rozszerzenia

### 1. Activity Sharing (Udostępnianie Activities)

Jeśli w przyszłości użytkownicy będą mogli udostępniać swoje activities publicznie lub innym użytkownikom:

```sql
-- Dodaj kolumnę visibility
alter table activities add column visibility text default 'private' check (visibility in ('private', 'public', 'friends'));

-- Policy dla publicznych activities (dla anon)
create policy activities_select_public_anon on activities
  for select
  to anon
  using (visibility = 'public');

-- Policy dla publicznych activities (dla authenticated)
create policy activities_select_public_authenticated on activities
  for select
  to authenticated
  using (visibility = 'public' or user_id = auth.uid());
```

### 2. Activity Comments/Kudos

Jeśli dodasz funkcję komentarzy lub "kudos" dla activities:

```sql
create table activity_kudos (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- Policy: authenticated może dawać kudos tylko dla publicznych activities lub własnych
create policy activity_kudos_insert on activity_kudos
  for insert
  to authenticated
  with check (
    user_id = auth.uid() and
    exists (
      select 1 from activities
      where id = activity_kudos.activity_id
        and (visibility = 'public' or user_id = auth.uid())
    )
  );
```

### 3. Admin Panel

Jeśli potrzebujesz panelu admina do przeglądania wszystkich activities:

```typescript
// src/services/activities-admin.ts
import { createSupabaseServerClient } from '../db/supabase.server.js';

export async function listAllActivities(adminUserId: string) {
  // Verify admin role
  const isAdmin = await checkAdminRole(adminUserId);
  if (!isAdmin) {
    throw new Error('Unauthorized');
  }
  
  // Use service role key to bypass RLS
  const client = createSupabaseServerClient({ useServiceKey: true });
  
  const { data, error } = await client
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
}
```

## Podsumowanie

Zmiany zapewniają, że:
- ✅ Wszystkie endpointy activities używają authenticated client (`locals.supabase`)
- ✅ RLS policies w bazie są przestrzegane
- ✅ Użytkownicy widzą TYLKO swoje activities
- ✅ Niezalogowani użytkownicy w ogóle nie mają dostępu do activities
- ✅ Kod jest zgodny z istniejącą architekturą projektu
- ✅ Bezpieczeństwo jest zapewnione na trzech warstwach (middleware, requireAuth, RLS)
- ✅ Implementacja jest spójna z wzorcem z goals i innych endpointów

**Kluczowa różnica vs Sports:** Activities są ZAWSZE prywatnymi danymi użytkownika i wymagają autentykacji dla WSZYSTKICH operacji, podczas gdy Sports są publicznym katalogiem dostępnym również dla niezalogowanych użytkowników (GET).

