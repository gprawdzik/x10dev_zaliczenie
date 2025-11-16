# Specyfikacja techniczna systemu autentykacji - StravaGoals

## 1. WPROWADZENIE

Niniejszy dokument stanowi szczegółową specyfikację techniczną systemu autentykacji dla aplikacji StravaGoals. Specyfikacja obejmuje implementację wymagań US-001, US-002, US-003, US-004 oraz US-015 z dokumentu PRD.

### 1.1. Zakres funkcjonalny

System autentykacji obejmuje następujące funkcjonalności:
- **Rejestracja** nowego użytkownika (email + hasło)
- **Logowanie** istniejącego użytkownika
- **Wylogowanie** użytkownika
- **Zmiana hasła** dla zalogowanego użytkownika
- **Usunięcie konta** wraz z wszystkimi danymi użytkownika
- **Ochrona zasobów** - ograniczenie dostępu do stron/API tylko dla zalogowanych użytkowników

### 1.2. Założenia technologiczne

- **Framework frontendowy**: Astro 5.15 + Vue 3.5 (Islands Architecture)
- **Backend autentykacji**: Supabase Auth
- **Rendering**: Hybrid (SSR + Static Generation)
- **Walidacja**: Zod
- **Sesje**: JWT tokeny zarządzane przez Supabase Auth
- **Styling**: Tailwind 4.1 + shadcn/vue

---

## 2. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 2.1. Struktura stron i komponentów

#### 2.1.1. Nowe strony Astro (server-rendered)

**A. Strona rejestracji - `/src/pages/auth/register.astro`**

```
Ścieżka: /auth/register
Prerender: false (SSR)
Layout: Dedykowany AuthLayout (bez Navbar z pełną nawigacją)
Komponenty: RegisterForm.vue (client:load)
```

**Odpowiedzialności:**
- Renderowanie layoutu strony rejestracji
- Sprawdzenie czy użytkownik jest już zalogowany (redirect do dashboard)
- Przekazanie niezbędnych meta-informacji (title, description)
- Obsługa przekierowań po stronie serwera

**Logika server-side:**
```typescript
// Sprawdź czy użytkownik jest już zalogowany
const { data: { session } } = await supabase.auth.getSession()
if (session) {
  return Astro.redirect('/')
}
```

**B. Strona logowania - `/src/pages/auth/login.astro`**

```
Ścieżka: /auth/login
Prerender: false (SSR)
Layout: Dedykowany AuthLayout
Komponenty: LoginForm.vue (client:load)
```

**Odpowiedzialności:**
- Renderowanie layoutu strony logowania
- Sprawdzenie czy użytkownik jest już zalogowany (redirect do dashboard)
- Przekazanie parametru `redirect` z query string do formularza
- Obsługa komunikatów flash (np. "Wylogowano pomyślnie")

**Logika server-side:**
```typescript
const { data: { session } } = await supabase.auth.getSession()
if (session) {
  return Astro.redirect('/')
}

const redirectTo = Astro.url.searchParams.get('redirect') || '/'
```

**C. Strona wylogowania - `/src/pages/auth/logout.astro`**

```
Ścieżka: /auth/logout
Prerender: false (SSR)
Layout: Brak (tylko logika)
Komponenty: Brak
```

**Odpowiedzialności:**
- Wylogowanie użytkownika po stronie serwera
- Usunięcie ciasteczek sesji
- Przekierowanie na stronę logowania

**Logika server-side:**
```typescript
await supabase.auth.signOut()
return Astro.redirect('/auth/login')
```

#### 2.1.2. Nowy layout autentykacji

**AuthLayout.astro - `/src/layouts/AuthLayout.astro`**

**Charakterystyka:**
- Uproszczony layout bez głównego Navbar
- Centrowane formularze z logo aplikacji
- Opcjonalny link powrotny
- Responsywny design (mobilny i desktop)
- Wspólny motyw wizualny dla wszystkich stron auth

**Struktura:**
```
+----------------------------------+
|         Logo StravaGoals         |
|                                  |
|     +----------------------+     |
|     |                      |     |
|     |   FORMULARZ          |     |
|     |   (Slot content)     |     |
|     |                      |     |
|     +----------------------+     |
|                                  |
|     Link do alternatywnej        |
|     akcji (np. "Masz konto?")    |
+----------------------------------+
```

#### 2.1.3. Nowe komponenty Vue (client-side)

**A. RegisterForm.vue - `/src/components/auth/RegisterForm.vue`**

**Odpowiedzialności:**
- Formularz rejestracji z polami: email, hasło, potwierdzenie hasła
- Walidacja po stronie klienta (Zod schema)
- Komunikacja z Supabase Auth API
- Obsługa stanów: idle, loading, success, error
- Wyświetlanie komunikatów błędów walidacji
- Automatyczne logowanie po udanej rejestracji
- Przekierowanie do dashboard po sukcesie

**Pola formularza:**
```typescript
interface RegisterFormData {
  email: string          // Wymagany, format email
  password: string       // Wymagany, min 10 znaków
  confirmPassword: string // Musi być identyczne z password
}
```

**Walidacja:**
- Email: format email, wymagany
- Hasło: min 10 znaków, wymagane
- Potwierdzenie hasła: identyczne z hasłem
- Błędy walidacyjne wyświetlane pod odpowiednimi polami

**Stany i komunikaty:**
- **Idle**: Formularz gotowy do wypełnienia
- **Loading**: "Tworzenie konta..." (disabled inputs + spinner)
- **Success**: "Konto utworzone! Przekierowanie..." → redirect do `/`
- **Error**: Wyświetlenie komunikatu błędu od Supabase (np. "Email już istnieje")

**Integracja z Supabase:**
```typescript
const { data, error } = await supabaseClient.auth.signUp({
  email: formData.email,
  password: formData.password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`
  }
})
```

**B. LoginForm.vue - `/src/components/auth/LoginForm.vue`**

**Odpowiedzialności:**
- Formularz logowania z polami: email, hasło
- Walidacja po stronie klienta
- Komunikacja z Supabase Auth API
- Obsługa stanów: idle, loading, success, error
- Przekierowanie do odpowiedniej strony po zalogowaniu
- Link do odzyskiwania hasła (przyszła funkcjonalność)

**Pola formularza:**
```typescript
interface LoginFormData {
  email: string     // Wymagany, format email
  password: string  // Wymagany
}
```

**Walidacja:**
- Email: format email, wymagany
- Hasło: wymagane (bez minimalnej długości przy logowaniu)

**Stany i komunikaty:**
- **Idle**: Formularz gotowy do wypełnienia
- **Loading**: "Logowanie..." (disabled inputs + spinner)
- **Success**: "Zalogowano pomyślnie!" → redirect
- **Error**: "Nieprawidłowy email lub hasło" (ogólny komunikat bezpieczeństwa)

**Integracja z Supabase:**
```typescript
const { data, error } = await supabaseClient.auth.signInWithPassword({
  email: formData.email,
  password: formData.password
})
```

**Przekierowania:**
- Domyślnie: `/` (dashboard)
- Z parametrem redirect: do wskazanej strony (np. `/settings` jeśli próbowano dostać się tam przed logowaniem)

**C. AuthGuard.vue - `/src/components/auth/AuthGuard.vue`**

**Odpowiedzialności:**
- HOC (Higher Order Component) do ochrony zawartości
- Sprawdzanie czy użytkownik jest zalogowany
- Wyświetlanie loadera podczas sprawdzania sesji
- Przekierowanie do logowania jeśli użytkownik niezalogowany
- Renderowanie zawartości (slot) jeśli użytkownik zalogowany

**Użycie:**
```vue
<AuthGuard>
  <!-- Chroniona zawartość -->
  <SettingsView />
</AuthGuard>
```

**Logika:**
```typescript
onMounted(async () => {
  const { data: { session } } = await supabaseClient.auth.getSession()
  
  if (!session) {
    window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`
  } else {
    isAuthenticated.value = true
  }
})
```

#### 2.1.4. Modyfikacje istniejących komponentów

**A. Navbar.vue - rozszerzenie o menu użytkownika**

**Obecny stan:**
```vue
<Button variant="ghost" size="sm" class="hidden md:flex">
  <span class="text-sm">👤 Użytkownik</span>
</Button>
```

**Wymagane zmiany:**
- Zamiana prostego przycisku na dropdown menu
- Wyświetlanie emaila użytkownika
- Link "Wyloguj" prowadzący do `/auth/logout`
- Obsługa stanu zalogowany/niezalogowany

**Nowa struktura:**
```vue
<template v-if="user">
  <DropdownMenu>
    <DropdownMenuTrigger>
      <Button variant="ghost" size="sm">
        👤 {{ userEmail }}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem disabled>
        {{ user.email }}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem as="a" href="/settings">
        ⚙️ Ustawienia
      </DropdownMenuItem>
      <DropdownMenuItem as="a" href="/auth/logout">
        🚪 Wyloguj
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
<template v-else>
  <Button as="a" href="/auth/login" variant="outline" size="sm">
    Zaloguj
  </Button>
</template>
```

**Logika:**
```typescript
const user = ref<User | null>(null)

onMounted(async () => {
  const { data: { user: currentUser } } = await supabaseClient.auth.getUser()
  user.value = currentUser
  
  // Nasłuchuj na zmiany sesji
  supabaseClient.auth.onAuthStateChange((event, session) => {
    user.value = session?.user ?? null
  })
})
```

**B. ProfilePanel.vue - rozszerzenie o formularze autentykacji**

**Obecna zawartość:**
- Zmiana hasła
- Usunięcie konta

**Status:** Już zaimplementowane z użyciem `useAuth()` composable

**Brak zmian** - komponenty `PasswordChangeForm.vue` i `AccountDeleteSection.vue` już realizują wymagania US-003 i US-004.

#### 2.1.5. Komponenty UI z shadcn/vue

**Wymagane komponenty (do dodania jeśli brak):**
- `DropdownMenu` - menu użytkownika w Navbar
- `Alert` - wyświetlanie komunikatów błędów/sukcesu
- `Spinner` lub `Loading` - stany ładowania

### 2.2. Walidacja i komunikaty błędów

#### 2.2.1. Schema walidacji Zod

**A. Rejestracja - `/src/validators/auth.ts`**

```typescript
import { z } from 'zod'

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email jest wymagany')
    .email('Nieprawidłowy format email'),
  password: z
    .string()
    .min(10, 'Hasło musi mieć minimum 10 znaków')
    .regex(/[A-Z]/, 'Hasło musi zawierać przynajmniej jedną wielką literę')
    .regex(/[a-z]/, 'Hasło musi zawierać przynajmniej jedną małą literę')
    .regex(/[0-9]/, 'Hasło musi zawierać przynajmniej jedną cyfrę'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Hasła muszą być identyczne',
  path: ['confirmPassword']
})

export type RegisterInput = z.infer<typeof registerSchema>
```

**B. Logowanie**

```typescript
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email jest wymagany')
    .email('Nieprawidłowy format email'),
  password: z
    .string()
    .min(1, 'Hasło jest wymagane')
})

export type LoginInput = z.infer<typeof loginSchema>
```

**C. Zmiana hasła** (już istnieje lub do dodania)

```typescript
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Obecne hasło jest wymagane'),
  newPassword: z
    .string()
    .min(10, 'Nowe hasło musi mieć minimum 10 znaków')
    .regex(/[A-Z]/, 'Hasło musi zawierać przynajmniej jedną wielką literę')
    .regex(/[a-z]/, 'Hasło musi zawierać przynajmniej jedną małą literę')
    .regex(/[0-9]/, 'Hasło musi zawierać przynajmniej jedną cyfrę'),
  confirmNewPassword: z.string()
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'Hasła muszą być identyczne',
  path: ['confirmNewPassword']
})

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
```

#### 2.2.2. Komunikaty błędów dla użytkownika

**Mapowanie błędów Supabase na przyjazne komunikaty:**

```typescript
// /src/lib/authErrors.ts
export const authErrorMessages: Record<string, string> = {
  // Rejestracja
  'User already registered': 'Konto z tym adresem email już istnieje',
  'Email not confirmed': 'Potwierdź swój adres email przed zalogowaniem',
  'Signup disabled': 'Rejestracja jest obecnie wyłączona',
  
  // Logowanie
  'Invalid login credentials': 'Nieprawidłowy email lub hasło',
  'Email not confirmed': 'Potwierdź swój adres email przed zalogowaniem',
  'Too many requests': 'Zbyt wiele prób logowania. Spróbuj ponownie później',
  
  // Zmiana hasła
  'New password should be different': 'Nowe hasło musi różnić się od obecnego',
  'Password is too weak': 'Hasło jest zbyt słabe',
  
  // Ogólne
  'Network error': 'Błąd połączenia. Sprawdź swoje połączenie internetowe',
  'Internal server error': 'Wystąpił błąd serwera. Spróbuj ponownie później',
}

export function getAuthErrorMessage(error: any): string {
  const message = error?.message || ''
  return authErrorMessages[message] || 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie'
}
```

### 2.3. Główne scenariusze użytkownika (flow)

#### Scenariusz 1: Rejestracja nowego użytkownika (US-001)

**Kroki:**
1. Użytkownik wchodzi na `/auth/register`
2. Wypełnia formularz: email, hasło, potwierdzenie hasła
3. Kliknięcie "Zarejestruj się":
   - Walidacja po stronie klienta (Zod)
   - Jeśli błędy → wyświetl komunikaty pod polami
   - Jeśli OK → wywołaj `supabase.auth.signUp()`
4. Supabase tworzy konto:
   - **Sukces**: Użytkownik automatycznie zalogowany → przekierowanie na `/` (dashboard)
   - **Błąd**: Wyświetl komunikat błędu (np. "Email już istnieje")

**Uwaga:** W zależności od konfiguracji Supabase, możliwe jest wymaganie potwierdzenia email. W MVP zakładamy automatyczne potwierdzenie (email confirmation disabled).

#### Scenariusz 2: Logowanie istniejącego użytkownika (US-002)

**Kroki:**
1. Użytkownik wchodzi na `/auth/login` (np. z linku w Navbar lub przekierowania z chronionej strony)
2. Wypełnia formularz: email, hasło
3. Kliknięcie "Zaloguj":
   - Walidacja po stronie klienta
   - Wywołaj `supabase.auth.signInWithPassword()`
4. Supabase weryfikuje dane:
   - **Sukces**: Ustaw sesję → przekierowanie na stronę docelową (z parametru `redirect` lub `/`)
   - **Błąd**: Wyświetl komunikat "Nieprawidłowy email lub hasło"

#### Scenariusz 3: Wylogowanie użytkownika (US-015)

**Kroki:**
1. Zalogowany użytkownik klika "Wyloguj" w menu użytkownika (Navbar)
2. Przekierowanie na `/auth/logout`
3. Strona wywołuje `supabase.auth.signOut()` po stronie serwera
4. Usunięcie ciasteczek sesji
5. Przekierowanie na `/auth/login` z komunikatem "Wylogowano pomyślnie"

**Alternatywnie (client-side logout):**
- Kliknięcie "Wyloguj" wywołuje JavaScript handler
- Handler wywołuje `supabase.auth.signOut()`
- Po sukcesie: `window.location.href = '/auth/login'`

#### Scenariusz 4: Zmiana hasła (US-003)

**Kroki:**
1. Zalogowany użytkownik wchodzi na `/settings` → zakładka "Profil"
2. Wypełnia formularz zmiany hasła:
   - Obecne hasło
   - Nowe hasło (min 10 znaków)
   - Potwierdzenie nowego hasła
3. Kliknięcie "Zmień hasło":
   - Walidacja po stronie klienta
   - Wywołaj `useAuth().changePassword()`
   - Wewnętrznie: `supabase.auth.updateUser({ password: newPassword })`
4. Supabase aktualizuje hasło:
   - **Sukces**: Wyświetl toast "Hasło zmienione pomyślnie"
   - **Błąd**: Wyświetl komunikat błędu

**Uwaga:** Supabase Auth nie wymaga podania obecnego hasła dla zalogowanego użytkownika (weryfikacja przez JWT). Dla bezpieczeństwa można dodać re-authentication flow.

#### Scenariusz 5: Usunięcie konta (US-004)

**Kroki:**
1. Zalogowany użytkownik wchodzi na `/settings` → zakładka "Profil"
2. Klika przycisk "Usuń konto"
3. Pojawia się modal potwierdzenia:
   - Tytuł: "Czy na pewno chcesz usunąć konto?"
   - Treść: "Ta operacja jest nieodwracalna. Wszystkie Twoje dane zostaną trwale usunięte."
   - Przyciski: "Anuluj" i "Usuń konto"
4. Po potwierdzeniu:
   - Wywołaj `useAuth().deleteAccount()`
   - Wewnętrznie: wywołanie endpointu `/api/auth/delete-account`
   - Endpoint usuwa dane użytkownika z bazy (kaskadowo dzięki `on delete cascade`)
   - Endpoint usuwa użytkownika z Supabase Auth (admin API)
   - Wylogowanie użytkownika
5. Przekierowanie na `/auth/register` z komunikatem "Konto zostało usunięte"

#### Scenariusz 6: Próba dostępu do chronionej strony bez logowania

**Kroki:**
1. Niezalogowany użytkownik próbuje wejść na `/settings` (lub inną chronioną stronę)
2. Middleware sprawdza sesję po stronie serwera
3. Brak sesji → przekierowanie na `/auth/login?redirect=/settings`
4. Po zalogowaniu → przekierowanie z powrotem na `/settings`

---

## 3. LOGIKA BACKENDOWA

### 3.1. Struktura endpointów API

Większość operacji autentykacyjnych jest obsługiwana bezpośrednio przez Supabase Auth SDK po stronie klienta. Dodatkowo tworzymy dedykowane endpointy dla operacji wymagających uprawnień serwera.

#### 3.1.1. Endpoint usuwania konta

**A. DELETE `/api/auth/delete-account` - `/src/pages/api/auth/delete-account.ts`**

**Odpowiedzialności:**
- Weryfikacja tokenu JWT (użytkownik musi być zalogowany)
- Usunięcie użytkownika z Supabase Auth (admin API)
- Kaskadowe usunięcie wszystkich powiązanych danych (RLS + `on delete cascade`)

**Struktura:**

```typescript
import type { APIRoute } from 'astro'
import { requireAuth } from '@/middleware/requireAuth'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/db/database.types'

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
}

// Admin client z uprawnieniami service_role
const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export const DELETE: APIRoute = async ({ request }) => {
  try {
    // Weryfikacja autentykacji
    const { userId } = await requireAuth(request)
    
    // Usunięcie użytkownika z Supabase Auth
    // To automatycznie kaskadowo usuwa wszystkie powiązane dane
    // dzięki foreign key constraints z ON DELETE CASCADE
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    
    if (error) {
      console.error('Error deleting user:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to delete account' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Account deletion error:', error)
    return new Response(
      JSON.stringify({ error: 'Unauthorized or invalid request' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
```

**Walidacja:**
- Token JWT musi być prawidłowy (middleware `requireAuth`)
- Użytkownik musi istnieć w systemie

**Obsługa błędów:**
- 401: Brak autoryzacji / nieprawidłowy token
- 500: Błąd podczas usuwania konta

**Kaskadowe usuwanie danych:**
Wszystkie tabele w bazie mają foreign key do `auth.users(id)` z `ON DELETE CASCADE`:
- `goals` → automatycznie usuwane
- `activities` → automatycznie usuwane
- `ai_suggestions` → automatycznie usuwane
- `goal_history` → automatycznie usuwane (przez FK do `goals`)

#### 3.1.2. Istniejące endpointy - dodanie ochrony autentykacją

Wszystkie istniejące endpointy API już używają middleware `requireAuth`, więc są chronione:
- `/api/sports.ts` - GET, POST (wymaga auth)
- `/api/goals.ts` - CRUD operations (wymaga auth)
- `/api/activities.ts` - CRUD operations (wymaga auth)
- `/api/activities-generate.ts` - POST (wymaga auth)
- `/api/goal_history.ts` - GET (wymaga auth)

**Brak zmian** w istniejących endpointach - już są chronione.

### 3.2. Middleware i ochrona stron

#### 3.2.1. Middleware Astro

**A. Globalny middleware - `/src/middleware/index.ts`**

**Odpowiedzialności:**
- Sprawdzanie sesji użytkownika dla chronionych stron
- Przekierowanie niezalogowanych użytkowników na `/auth/login`
- Przekierowanie zalogowanych użytkowników ze stron auth na dashboard
- Udostępnienie użytkownika w `Astro.locals`

**Implementacja:**

```typescript
import { defineMiddleware } from 'astro:middleware'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/db/database.types'

// Ścieżki wymagające autentykacji
const protectedRoutes = [
  '/settings',
  '/goals',
  '/activities',
  '/progress',
  '/api/sports',
  '/api/goals',
  '/api/activities',
  '/api/activities-generate',
  '/api/goal_history'
]

// Ścieżki dostępne tylko dla niezalogowanych
const authOnlyRoutes = [
  '/auth/login',
  '/auth/register'
]

// Ścieżki publiczne (bez ograniczeń)
const publicRoutes = [
  '/',
  '/about',
  '/auth/logout'
]

export const onRequest = defineMiddleware(async ({ request, locals, redirect, cookies }, next) => {
  const url = new URL(request.url)
  const pathname = url.pathname
  
  // Inicjalizacja Supabase Server Client (SSR)
  const supabase = createServerClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL!,
    import.meta.env.PUBLIC_SUPABASE_KEY!,
    {
      cookies: {
        get(key) {
          return cookies.get(key)?.value
        },
        set(key, value, options) {
          cookies.set(key, value, options)
        },
        remove(key, options) {
          cookies.delete(key, options)
        }
      }
    }
  )
  
  // Pobierz sesję użytkownika
  const { data: { session } } = await supabase.auth.getSession()
  
  // Udostępnij użytkownika w locals (dostępne w komponentach Astro)
  locals.user = session?.user ?? null
  locals.supabase = supabase
  
  // Logika przekierowań
  
  // 1. Chronione strony - wymagają zalogowania
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  if (isProtectedRoute && !session) {
    return redirect(`/auth/login?redirect=${encodeURIComponent(pathname)}`)
  }
  
  // 2. Strony auth - dostępne tylko dla niezalogowanych
  const isAuthRoute = authOnlyRoutes.some(route => pathname.startsWith(route))
  if (isAuthRoute && session) {
    return redirect('/')
  }
  
  // 3. Pozwól na dalsze przetwarzanie
  return next()
})
```

**Rozszerzenie typów Astro.locals:**

```typescript
// /src/env.d.ts
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string
  readonly PUBLIC_SUPABASE_KEY: string
  readonly SUPABASE_SERVICE_ROLE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare namespace App {
  interface Locals {
    user: import('@supabase/supabase-js').User | null
    supabase: import('@supabase/supabase-js').SupabaseClient<
      import('./db/database.types').Database
    >
  }
}
```

**B. Middleware dla API endpoints - już istnieje**

`/src/middleware/requireAuth.ts` już jest zaimplementowany i działa poprawnie. Używa ekstrakcji tokena z nagłówków lub ciasteczek.

**Brak zmian** - istniejący middleware jest wystarczający.

### 3.3. Serwisy i composables

#### 3.3.1. Rozszerzenie useAuth composable

**Plik: `/src/composables/useAuth.ts`**

**Obecne metody:**
- `changePassword(currentPassword, newPassword)`
- `deleteAccount()`
- `signOut()`
- `getCurrentUser()`

**Nowe metody do dodania:**

```typescript
/**
 * Rejestruje nowego użytkownika
 */
const signUp = async (email: string, password: string) => {
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          // Opcjonalne metadane użytkownika
        }
      }
    })

    if (error) {
      throw error
    }

    return { success: true, user: data.user, session: data.session }
  } catch (error) {
    console.error('Error signing up:', error)
    throw error
  }
}

/**
 * Loguje użytkownika
 */
const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      throw error
    }

    return { success: true, user: data.user, session: data.session }
  } catch (error) {
    console.error('Error signing in:', error)
    throw error
  }
}

/**
 * Sprawdza czy użytkownik jest zalogowany
 */
const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession()
    return !!session
  } catch (error) {
    console.error('Error checking authentication:', error)
    return false
  }
}

/**
 * Nasłuchuje na zmiany stanu autentykacji
 */
const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabaseClient.auth.onAuthStateChange(callback)
}

// Eksport
return {
  signUp,          // NOWE
  signIn,          // NOWE
  isAuthenticated, // NOWE
  onAuthStateChange, // NOWE
  changePassword,
  deleteAccount,
  signOut,
  getCurrentUser
}
```

#### 3.3.2. Nowy composable useAuthRedirect

**Plik: `/src/composables/useAuthRedirect.ts`**

**Cel:** Zarządzanie przekierowaniami po autentykacji

```typescript
export function useAuthRedirect() {
  /**
   * Pobiera URL do przekierowania z query parametrów
   */
  const getRedirectUrl = (): string => {
    const params = new URLSearchParams(window.location.search)
    const redirect = params.get('redirect')
    
    // Walidacja - tylko relatywne URL-e w ramach aplikacji
    if (redirect && redirect.startsWith('/')) {
      return redirect
    }
    
    return '/' // domyślnie dashboard
  }

  /**
   * Przekierowuje użytkownika po udanej autentykacji
   */
  const redirectAfterAuth = () => {
    const url = getRedirectUrl()
    window.location.href = url
  }

  /**
   * Przekierowuje do strony logowania z zachowaniem aktualnej ścieżki
   */
  const redirectToLogin = () => {
    const currentPath = window.location.pathname
    window.location.href = `/auth/login?redirect=${encodeURIComponent(currentPath)}`
  }

  return {
    getRedirectUrl,
    redirectAfterAuth,
    redirectToLogin
  }
}
```

### 3.4. Konfiguracja zmiennych środowiskowych

**Wymagane zmienne (plik `.env`):**

```bash
# Supabase - publiczne klucze (dostępne w kliencie)
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase - klucz service_role (TYLKO na serwerze, NIGDY w kliencie)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Aktualizacja pliku `.env.dist`:**

```bash
# Supabase Configuration
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenRouter AI (istniejące)
OPENROUTER_API_KEY=your-openrouter-key
```

**Bezpieczeństwo:**
- `PUBLIC_*` - bezpieczne do eksponowania w kliencie
- `SUPABASE_SERVICE_ROLE_KEY` - używany TYLKO po stronie serwera (API routes, admin operations)

---

## 4. SYSTEM AUTENTYKACJI

### 4.1. Wykorzystanie Supabase Auth

#### 4.1.1. Architektura Supabase Auth

Supabase Auth jest w pełni zarządzanym systemem autentykacji opartym na PostgreSQL i JWT tokenach.

**Kluczowe komponenty:**
- **auth.users** - tabela użytkowników w schemacie `auth`
- **JWT Tokens** - access token (krótkotrwały) i refresh token (długotrwały)
- **Row Level Security (RLS)** - automatyczna izolacja danych użytkowników
- **Auth Helpers** - biblioteki do integracji z różnymi frameworkami

#### 4.1.2. Przepływ tokenów JWT

**1. Rejestracja / Logowanie:**
```
Klient → Supabase Auth API
          ↓
     Generuje JWT tokens
          ↓
    Zwraca access_token i refresh_token
          ↓
  Tokeny zapisywane w localStorage i cookies
```

**2. Żądania do API:**
```
Klient → Request + Authorization: Bearer {access_token}
          ↓
  Server/API endpoint
          ↓
  requireAuth() weryfikuje token
          ↓
  Supabase sprawdza ważność tokena
          ↓
  Zwraca user_id z tokena
```

**3. Odświeżanie sesji:**
```
Access token wygasa (domyślnie 1h)
          ↓
  Klient automatycznie używa refresh_token
          ↓
  Supabase generuje nowy access_token
          ↓
  Sesja kontynuowana bez przery
```

#### 4.1.3. Integracja z Astro SSR

**Supabase SSR Helper (`@supabase/ssr`):**

```typescript
import { createServerClient } from '@supabase/ssr'

// W middleware Astro
const supabase = createServerClient(
  supabaseUrl,
  supabaseKey,
  {
    cookies: {
      get(key) {
        return cookies.get(key)?.value
      },
      set(key, value, options) {
        cookies.set(key, value, options)
      },
      remove(key, options) {
        cookies.delete(key, options)
      }
    }
  }
)
```

**Korzyści:**
- Automatyczne zarządzanie ciasteczkami
- Server-side rendering z prawidłową sesją
- Bezpieczne przekazywanie stanu autentykacji do klienta

#### 4.1.4. Konfiguracja Supabase Auth

**Ustawienia w Supabase Dashboard:**

1. **Email Authentication:**
   - Włączone
   - Confirmation email: Wyłączone dla MVP (auto-confirm)
   - Email templates: Domyślne (można customizować)

2. **Password Requirements:**
   - Minimum length: 10 znaków (ustawione w walidacji Zod)
   - Supabase domyślnie: 6 znaków (nadpisane w aplikacji)

3. **Session Duration:**
   - Access token: 1 godzina (domyślnie)
   - Refresh token: 30 dni (domyślnie)

4. **URL Configuration:**
   - Site URL: `https://your-app.mikr.us` (produkcja) lub `http://localhost:4321` (dev)
   - Redirect URLs: Whitelist dla `{SITE_URL}/auth/callback`

### 4.2. Row Level Security (RLS)

**Aktualny stan:** RLS włączony na wszystkich tabelach, ale polityki są wyłączone (migracja `20251115160000_disable_rls_on_tables.sql`).

**Dla autentykacji:** RLS jest kluczowe dla bezpieczeństwa. Polityki już są zdefiniowane w `20251102120000_initial_schema.sql`:

```sql
-- Przykład dla tabeli goals
create policy goals_select_authenticated on goals
  for select
  to authenticated
  using (user_id = auth.uid());
```

**Funkcja `auth.uid()`:**
- Zwraca `user_id` z JWT tokena aktualnie zalogowanego użytkownika
- Używana w politykach RLS do filtrowania danych
- Automatycznie integruje się z Supabase Auth

**Rekomendacja:** Przywrócić polityki RLS dla produkcji (usunąć migrację wyłączającą lub stworzyć nową włączającą).

### 4.3. Obsługa sesji

#### 4.3.1. Client-side session management

**Automatyczne zarządzanie przez Supabase SDK:**
```typescript
// SDK automatycznie:
// - Zapisuje tokeny w localStorage i cookies
// - Odświeża access_token gdy wygasa
// - Wywołuje callbacki przy zmianie stanu sesji
// - Synchronizuje sesję między kartami przeglądarki

supabaseClient.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session)
  
  // Możliwe eventy:
  // - SIGNED_IN
  // - SIGNED_OUT
  // - TOKEN_REFRESHED
  // - USER_UPDATED
  // - PASSWORD_RECOVERY
})
```

#### 4.3.2. Server-side session management

**W middleware Astro:**
```typescript
// Supabase SSR client automatycznie:
// - Odczytuje tokeny z cookies
// - Weryfikuje ważność sesji
// - Udostępnia session i user w request context

const { data: { session } } = await supabase.auth.getSession()
locals.user = session?.user ?? null
```

**W API endpoints:**
```typescript
// requireAuth middleware:
// - Ekstrahuje token z Authorization header lub cookies
// - Weryfikuje token przez Supabase
// - Zwraca user_id i user object
// - Rzuca AuthError jeśli token nieprawidłowy

const { userId, user } = await requireAuth(request)
```

### 4.4. Bezpieczeństwo

#### 4.4.1. Najlepsze praktyki bezpieczeństwa

**1. Ochrona kluczy:**
- `PUBLIC_SUPABASE_KEY` (anon key) - bezpieczny do eksponowania, ograniczony przez RLS
- `SUPABASE_SERVICE_ROLE_KEY` - **NIGDY** w kodzie klienta, tylko na serwerze
- Przechowywanie w `.env` (nie commitowane do git)

**2. Rate limiting:**
- Supabase automatycznie limituje liczbę prób logowania
- Komunikat: "Too many requests" po przekroczeniu limitu

**3. HTTPS:**
- Wymagane w produkcji
- Supabase wymusza HTTPS dla wszystkich żądań API

**4. CSRF Protection:**
- Tokeny JWT przechowywane w cookies z flagą `SameSite=Lax`
- Dodatkowa warstwa ochrony przed atakami CSRF

**5. XSS Protection:**
- Vue automatycznie escapuje HTML w szablonach
- Walidacja wszystkich danych wejściowych (Zod)
- Content Security Policy (CSP) - do rozważenia

**6. SQL Injection:**
- Supabase automatycznie używa parametryzowanych zapytań
- ORM-like API zapobiega SQL injection

#### 4.4.2. Walidacja i sanitizacja danych

**Warstwa 1 - Klient (Vue + Zod):**
```typescript
// Walidacja przed wysłaniem do API
const result = registerSchema.safeParse(formData)
if (!result.success) {
  // Wyświetl błędy walidacji
}
```

**Warstwa 2 - Serwer (API endpoints):**
```typescript
// Dodatkowa walidacja na serwerze
import { registerSchema } from '@/validators/auth'

const body = await request.json()
const validation = registerSchema.safeParse(body)

if (!validation.success) {
  return new Response(
    JSON.stringify({ error: validation.error.issues }),
    { status: 400 }
  )
}
```

**Warstwa 3 - Baza danych (constraints):**
```sql
-- Constraints w PostgreSQL
- NOT NULL constraints
- CHECK constraints (np. target_value >= 0)
- UNIQUE constraints (np. sports.code)
- Foreign key constraints
```

#### 4.4.3. Obsługa "zapamiętaj mnie"

Supabase automatycznie obsługuje długotrwałe sesje:
- Access token: 1h (krótkotrwały)
- Refresh token: 30 dni (długotrwały, automatycznie odnawia access token)

Użytkownik pozostaje zalogowany przez 30 dni bez konieczności ponownego logowania.

**Opcjonalnie:** Checkbox "Zapamiętaj mnie" może kontrolować politykę refresh tokenów (do implementacji w przyszłości).

---

## 5. ROUTING I NAWIGACJA

### 5.1. Mapa routingu

**Strony publiczne (dostępne bez logowania):**
- `/` - Dashboard (widok publiczny z ograniczoną funkcjonalnością)
- `/about` - O aplikacji
- `/auth/login` - Logowanie
- `/auth/register` - Rejestracja

**Strony chronione (wymagają logowania):**
- `/settings` - Ustawienia użytkownika
- `/goals` - Zarządzanie celami
- `/activities` - Lista aktywności
- `/progress` - Wizualizacje postępów

**Strony specjalne:**
- `/auth/logout` - Wylogowanie (tylko logika, bez widoku)
- `/auth/callback` - OAuth callback (przyszła funkcjonalność, np. logowanie przez Google)

### 5.2. Przekierowania

**Logika przekierowań w middleware:**

| Scenariusz | Akcja |
|------------|-------|
| Niezalogowany → chroniona strona | Redirect do `/auth/login?redirect={path}` |
| Zalogowany → `/auth/login` | Redirect do `/` |
| Zalogowany → `/auth/register` | Redirect do `/` |
| Po rejestracji | Redirect do `/` |
| Po logowaniu | Redirect do `{redirect}` lub `/` |
| Po wylogowaniu | Redirect do `/auth/login` |
| Po usunięciu konta | Redirect do `/auth/register` |

### 5.3. Aktualizacja Navbar

**Stan zalogowany:**
- Logo + linki nawigacji
- Dropdown menu użytkownika (email + "Ustawienia" + "Wyloguj")

**Stan niezalogowany:**
- Logo + linki nawigacji (tylko publiczne)
- Przycisk "Zaloguj" → `/auth/login`

**Opcjonalnie:** Link "Zarejestruj się" dla niezalogowanych użytkowników.

---

## 6. MIGRACJE BAZY DANYCH

### 6.1. Istniejące tabele

**Tabela `auth.users`:**
- Zarządzana przez Supabase Auth
- Nie wymaga migracji (istnieje domyślnie)
- Kolumny kluczowe: `id`, `email`, `encrypted_password`, `created_at`, `updated_at`

### 6.2. Foreign keys do auth.users

**Wszystkie tabele aplikacji już mają prawidłowe FK:**

```sql
-- goals
user_id uuid not null references auth.users(id) on delete cascade

-- activities
user_id uuid not null references auth.users(id) on delete cascade

-- ai_suggestions
user_id uuid not null references auth.users(id) on delete cascade
```

**Status:** Brak wymaganych zmian w schemacie bazy danych. Migracja `20251115170000_drop_user_foreign_keys.sql` usuwa FK, co jest niezgodne z wymaganiami. Należy przywrócić FK.

### 6.3. Rekomendowane zmiany

**Nowa migracja: `20251116000000_restore_user_foreign_keys.sql`**

```sql
-- Migration: Restore user foreign keys for proper cascade deletion
-- Purpose: Ensure all user data is deleted when user account is deleted
-- Author: Auth Specification
-- Date: 2025-11-16

-- Restore foreign keys on all tables
-- Assumes previous migration dropped them incorrectly

-- goals table
alter table goals
  add constraint goals_user_id_fkey
  foreign key (user_id)
  references auth.users(id)
  on delete cascade;

-- activities table
alter table activities
  add constraint activities_user_id_fkey
  foreign key (user_id)
  references auth.users(id)
  on delete cascade;

-- ai_suggestions table
alter table ai_suggestions
  add constraint ai_suggestions_user_id_fkey
  foreign key (user_id)
  references auth.users(id)
  on delete cascade;

-- Note: goal_history is indirectly protected by FK to goals
-- When a goal is deleted, its history is also deleted via cascade
```

---

## 7. IMPLEMENTACJA - KOLEJNOŚĆ KROKÓW

### Faza 1: Struktura i konfiguracja (Fundament)

1. **Zmienne środowiskowe**
   - Dodać `SUPABASE_SERVICE_ROLE_KEY` do `.env`
   - Zaktualizować `.env.dist`

2. **Typy TypeScript**
   - Rozszerzyć `env.d.ts` o `App.Locals`
   - Dodać typy dla auth (jeśli brakuje)

3. **Walidatory Zod**
   - Stworzyć `/src/validators/auth.ts` z schemas: register, login, changePassword

4. **Utility functions**
   - Stworzyć `/src/lib/authErrors.ts` z mapowaniem błędów Supabase

### Faza 2: Backend i middleware (Logika serwera)

5. **Middleware Astro**
   - Zaktualizować `/src/middleware/index.ts` z logiką ochrony stron i sesji SSR

6. **Supabase Admin Client**
   - Stworzyć `/src/db/supabase.admin.ts` dla operacji admin (service_role)

7. **API Endpoint - delete account**
   - Stworzyć `/src/pages/api/auth/delete-account.ts`

8. **Composable useAuth - rozszerzenie**
   - Dodać metody: `signUp()`, `signIn()`, `isAuthenticated()`, `onAuthStateChange()`

9. **Composable useAuthRedirect**
   - Stworzyć `/src/composables/useAuthRedirect.ts`

### Faza 3: Komponenty UI (Widoki i formularze)

10. **AuthLayout**
    - Stworzyć `/src/layouts/AuthLayout.astro`

11. **RegisterForm**
    - Stworzyć `/src/components/auth/RegisterForm.vue`

12. **LoginForm**
    - Stworzyć `/src/components/auth/LoginForm.vue`

13. **AuthGuard** (opcjonalnie)
    - Stworzyć `/src/components/auth/AuthGuard.vue`

14. **Dropdown Menu** (shadcn/vue)
    - Dodać komponenty `DropdownMenu` jeśli brakuje

15. **Navbar - rozszerzenie**
    - Zaktualizować `/src/components/layout/Navbar.vue` o menu użytkownika

### Faza 4: Strony autentykacji (Routing)

16. **Strona rejestracji**
    - Stworzyć `/src/pages/auth/register.astro`

17. **Strona logowania**
    - Stworzyć `/src/pages/auth/login.astro`

18. **Strona wylogowania**
    - Stworzyć `/src/pages/auth/logout.astro`

### Faza 5: Integracja z istniejącymi stronami

19. **Dashboard (`/`)**
    - Dostosować do dwóch stanów: zalogowany / niezalogowany
    - Opcjonalnie: różne widoki w zależności od stanu auth

20. **Chronione strony**
    - Zweryfikować że middleware chroni: `/settings`, `/goals`, `/activities`, `/progress`
    - Dodać fallbacki jeśli potrzebne (loading states)

### Faza 6: Migracje bazy danych

21. **Przywrócenie FK**
    - Stworzyć migrację `20251116000000_restore_user_foreign_keys.sql`
    - Uruchomić na lokalnej bazie Supabase

22. **Przywrócenie RLS** (opcjonalnie)
    - Rozważyć włączenie polityk RLS dla produkcji

### Faza 7: Testowanie i poprawki

23. **Testowanie flow rejestracji**
    - Pozytywne: poprawne dane → konto utworzone → automatyczne logowanie
    - Negatywne: błędne dane → komunikaty walidacji

24. **Testowanie flow logowania**
    - Pozytywne: poprawne dane → zalogowany → przekierowanie
    - Negatywne: błędne dane → komunikat błędu

25. **Testowanie flow wylogowania**
    - Kliknięcie "Wyloguj" → wylogowany → przekierowanie do logowania

26. **Testowanie zmiany hasła**
    - Zmiana hasła → nowe hasło działa przy logowaniu

27. **Testowanie usuwania konta**
    - Usunięcie konta → dane usunięte z bazy → nie można się zalogować

28. **Testowanie ochrony stron**
    - Próba dostępu do chronionych stron bez logowania → przekierowanie
    - Zalogowany dostęp → strona wyświetlona

29. **Testowanie przekierowań**
    - Parametr `?redirect=` działa poprawnie

30. **Testowanie sesji**
    - Odświeżenie strony → użytkownik pozostaje zalogowany
    - Wygaśnięcie tokena → automatyczne odświeżenie lub redirect do logowania

### Faza 8: Dokumentacja i finalizacja

31. **Komentarze w kodzie**
    - Dodać JSDoc komentarze do kluczowych funkcji

32. **README - aktualizacja**
    - Dodać sekcję o autentykacji
    - Wyjaśnić jak skonfigurować Supabase Auth

33. **Zmienne środowiskowe - dokumentacja**
    - Opisać wszystkie wymagane zmienne w README

---

## 8. WYMAGANIA NIEFUNKCJONALNE

### 8.1. Wydajność

- Czas ładowania strony logowania: < 1s
- Czas odpowiedzi API (login/register): < 500ms (zależnie od Supabase)
- Server-side middleware: < 50ms overhead na request

### 8.2. Dostępność (Accessibility)

- Formularze z odpowiednimi labelami (`<label for="...">`)
- Komunikaty błędów ogłaszane przez screen readery (`aria-live`)
- Nawigacja klawiaturą (Tab, Enter)
- Odpowiedni kontrast kolorów (zgodnie z WCAG AA)

### 8.3. Responsywność

- Formularze auth działają na mobile (320px+) i desktop
- Menu użytkownika adaptuje się do rozmiaru ekranu
- Touch-friendly buttony (min 44x44px)

### 8.4. Kompatybilność przeglądarek

- Chrome, Firefox, Safari, Edge (ostatnie 2 wersje)
- Wsparcie dla nowoczesnych API (fetch, localStorage, crypto)
- Fallbacki dla starszych przeglądarek (opcjonalnie)

---

## 9. PODSUMOWANIE I KLUCZOWE WNIOSKI

### 9.1. Główne komponenty systemu

**Frontend (Astro + Vue):**
- Strony: `/auth/login`, `/auth/register`, `/auth/logout`
- Komponenty: `LoginForm`, `RegisterForm`, menu użytkownika w Navbar
- Layout: `AuthLayout` dla stron autentykacji
- Composables: rozszerzony `useAuth`, nowy `useAuthRedirect`

**Backend (Astro SSR + Supabase):**
- Middleware: globalna ochrona stron i zarządzanie sesjami SSR
- API endpoints: `/api/auth/delete-account`
- Supabase Auth: obsługa rejestracji, logowania, sesji, JWT

**Baza danych:**
- Tabela `auth.users` (zarządzana przez Supabase)
- Foreign keys z `on delete cascade` dla automatycznego czyszczenia danych
- RLS policies dla bezpieczeństwa (do włączenia w produkcji)

### 9.2. Kluczowe decyzje architektoniczne

1. **Hybrid rendering**: SSR dla stron auth + CSR dla formularzy (Islands Architecture)
2. **JWT tokens**: Zarządzane przez Supabase, przechowywane w cookies + localStorage
3. **Middleware Astro**: Centralna logika ochrony stron i przekierowań
4. **Dedykowany layout**: AuthLayout dla spójnego wyglądu stron autentykacji
5. **Kaskadowe usuwanie**: ON DELETE CASCADE dla automatycznego czyszczenia danych użytkownika

### 9.3. Bezpieczeństwo

- **RLS** dla izolacji danych użytkowników
- **Service role key** tylko na serwerze, nigdy w kliencie
- **HTTPS** wymagane w produkcji
- **Rate limiting** przez Supabase
- **Walidacja** na trzech warstwach: klient, serwer, baza danych

### 9.4. Zgodność z wymaganiami PRD

| User Story | Status | Implementacja |
|------------|--------|---------------|
| US-001: Rejestracja | ✅ Covered | RegisterForm + Supabase Auth signUp |
| US-002: Logowanie | ✅ Covered | LoginForm + Supabase Auth signInWithPassword |
| US-003: Zmiana hasła | ✅ Covered | useAuth.changePassword + Supabase updateUser |
| US-004: Usunięcie konta | ✅ Covered | useAuth.deleteAccount + API endpoint + admin.deleteUser |
| US-015: Wylogowanie | ✅ Covered | Menu użytkownika + /auth/logout + Supabase signOut |

### 9.5. Następne kroki po implementacji

1. **Email confirmation**: Włączenie potwierdzenia email w Supabase dla większego bezpieczeństwa
2. **Password reset**: Dodanie funkcji "Zapomniałem hasła"
3. **Social login**: Opcjonalne logowanie przez Google, GitHub, itp.
4. **Two-factor authentication**: Dodatkowa warstwa bezpieczeństwa (2FA)
5. **Session management**: Panel zarządzania aktywnymi sesjami
6. **Audit log**: Historia logowań i zmian w koncie

---

## 10. DIAGRAMY I SCHEMATY

### 10.1. Diagram przepływu rejestracji

```
┌──────────────┐
│   Użytkownik │
└──────┬───────┘
       │
       │ Wchodzi na /auth/register
       ▼
┌─────────────────────────────┐
│  register.astro (SSR)       │
│  - Sprawdza sesję           │
│  - Jeśli zalogowany → /     │
└──────────┬──────────────────┘
           │
           │ Renderuje
           ▼
┌─────────────────────────────┐
│  RegisterForm.vue (CSR)     │
│  - Formularz: email, hasło  │
│  - Walidacja (Zod)          │
└──────────┬──────────────────┘
           │
           │ Wysyła dane
           ▼
┌─────────────────────────────┐
│  Supabase Auth API          │
│  - Tworzy użytkownika       │
│  - Generuje JWT tokens      │
└──────────┬──────────────────┘
           │
           ├─ Sukces ──────────┐
           │                   │
           │                   ▼
           │          ┌──────────────────┐
           │          │ Automatyczne     │
           │          │ zalogowanie      │
           │          └────────┬─────────┘
           │                   │
           │                   ▼
           │          ┌──────────────────┐
           │          │ Redirect do /    │
           │          └──────────────────┘
           │
           └─ Błąd ────────────┐
                               │
                               ▼
                      ┌──────────────────┐
                      │ Komunikat błędu  │
                      │ (np. email exist)│
                      └──────────────────┘
```

### 10.2. Diagram przepływu logowania

```
┌──────────────┐
│   Użytkownik │
└──────┬───────┘
       │
       │ Wchodzi na /auth/login?redirect=/settings
       ▼
┌─────────────────────────────┐
│  login.astro (SSR)          │
│  - Sprawdza sesję           │
│  - Jeśli zalogowany → /     │
│  - Pobiera parametr redirect│
└──────────┬──────────────────┘
           │
           │ Renderuje
           ▼
┌─────────────────────────────┐
│  LoginForm.vue (CSR)        │
│  - Formularz: email, hasło  │
│  - Walidacja (Zod)          │
└──────────┬──────────────────┘
           │
           │ Wysyła dane
           ▼
┌─────────────────────────────┐
│  Supabase Auth API          │
│  - Weryfikuje dane          │
│  - Generuje JWT tokens      │
└──────────┬──────────────────┘
           │
           ├─ Sukces ──────────┐
           │                   │
           │                   ▼
           │          ┌──────────────────┐
           │          │ Redirect do      │
           │          │ /settings        │
           │          └──────────────────┘
           │
           └─ Błąd ────────────┐
                               │
                               ▼
                      ┌──────────────────┐
                      │ "Nieprawidłowy   │
                      │ email lub hasło" │
                      └──────────────────┘
```

### 10.3. Diagram przepływu usuwania konta

```
┌──────────────┐
│   Użytkownik │
└──────┬───────┘
       │
       │ Klika "Usuń konto" w /settings
       ▼
┌─────────────────────────────┐
│  AccountDeleteSection.vue   │
│  - Pokazuje modal           │
│  - "Czy na pewno?"          │
└──────────┬──────────────────┘
           │
           │ Potwierdza
           ▼
┌─────────────────────────────┐
│  useAuth().deleteAccount()  │
│  - Wywołuje API endpoint    │
└──────────┬──────────────────┘
           │
           │ DELETE /api/auth/delete-account
           ▼
┌─────────────────────────────┐
│  API Endpoint (SSR)         │
│  - requireAuth(request)     │
│  - Pobiera user_id          │
└──────────┬──────────────────┘
           │
           │ Używa admin client
           ▼
┌─────────────────────────────┐
│  Supabase Admin API         │
│  - deleteUser(user_id)      │
└──────────┬──────────────────┘
           │
           │ Kaskadowo usuwa
           ▼
┌─────────────────────────────┐
│  PostgreSQL                 │
│  - DELETE FROM auth.users   │
│  - CASCADE: goals, activities│
└──────────┬──────────────────┘
           │
           │ Sukces
           ▼
┌─────────────────────────────┐
│  signOut() + Redirect       │
│  → /auth/register           │
└─────────────────────────────┘
```

### 10.4. Architektura komponentów

```
┌─────────────────────────────────────────────────────────┐
│                    WARSTWA PREZENTACJI                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────┐  ┌──────────────────┐           │
│  │  LoginForm.vue   │  │ RegisterForm.vue │           │
│  │  (client:load)   │  │  (client:load)   │           │
│  └────────┬─────────┘  └────────┬─────────┘           │
│           │                     │                      │
│           └──────────┬──────────┘                      │
│                      │                                 │
│           ┌──────────▼──────────┐                      │
│           │   useAuth()         │                      │
│           │   useAuthRedirect() │                      │
│           └──────────┬──────────┘                      │
│                      │                                 │
└──────────────────────┼─────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────┐
│                  WARSTWA KOMUNIKACJI                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│           ┌──────────────────────┐                     │
│           │  Supabase Client     │                     │
│           │  (supabase.client.ts)│                     │
│           └──────────┬───────────┘                     │
│                      │                                 │
└──────────────────────┼─────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────┐
│                   WARSTWA MIDDLEWARE                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌────────────────────────────────────────────┐       │
│  │  Astro Middleware (middleware/index.ts)    │       │
│  │  - Sprawdza sesję (SSR)                    │       │
│  │  - Ochrona stron                           │       │
│  │  - Przekierowania                          │       │
│  └────────────────────┬───────────────────────┘       │
│                       │                               │
│           ┌───────────▼────────────┐                  │
│           │  requireAuth()         │                  │
│           │  (API endpoints)       │                  │
│           └───────────┬────────────┘                  │
│                       │                               │
└───────────────────────┼───────────────────────────────┘
                        │
┌───────────────────────▼───────────────────────────────┐
│                  WARSTWA DANYCH                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌────────────────────┐    ┌───────────────────┐     │
│  │  Supabase Auth     │    │   PostgreSQL      │     │
│  │  (auth.users)      │◄───┤   (goals, etc.)   │     │
│  └────────────────────┘    └───────────────────┘     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 11. CHECKLIST IMPLEMENTACJI

### ✅ Gotowe do użycia (już zaimplementowane)

- [x] `useAuth` composable (podstawowe metody)
- [x] `requireAuth` middleware dla API
- [x] Supabase client configuration
- [x] Schemat bazy danych z FK do auth.users
- [x] RLS policies (zdefiniowane, do włączenia)
- [x] Komponenty: PasswordChangeForm, AccountDeleteSection
- [x] Layout: AppLayout
- [x] Navbar (do rozszerzenia o dropdown)

### 🔧 Do implementacji

#### Backend
- [ ] Rozszerzyć `useAuth` o metody: signUp, signIn, isAuthenticated, onAuthStateChange
- [ ] Stworzyć `useAuthRedirect` composable
- [ ] Stworzyć Supabase admin client (service_role)
- [ ] Stworzyć API endpoint `/api/auth/delete-account`
- [ ] Zaimplementować globalny middleware Astro (ochrona stron + SSR sessions)
- [ ] Stworzyć walidatory Zod dla auth (/validators/auth.ts)
- [ ] Stworzyć utility dla mapowania błędów (/lib/authErrors.ts)

#### Frontend
- [ ] Stworzyć AuthLayout
- [ ] Stworzyć LoginForm.vue
- [ ] Stworzyć RegisterForm.vue
- [ ] Dodać komponenty DropdownMenu (jeśli brakuje w shadcn/vue)
- [ ] Rozszerzyć Navbar o menu użytkownika
- [ ] Stworzyć stronę /auth/login.astro
- [ ] Stworzyć stronę /auth/register.astro
- [ ] Stworzyć stronę /auth/logout.astro

#### Baza danych
- [ ] Przywrócić foreign keys (jeśli zostały usunięte)
- [ ] Rozważyć włączenie RLS policies

#### Dokumentacja
- [ ] Zaktualizować README o sekcję autentykacji
- [ ] Dodać komentarze JSDoc
- [ ] Zaktualizować .env.dist

#### Testowanie
- [ ] Przetestować flow rejestracji
- [ ] Przetestować flow logowania
- [ ] Przetestować flow wylogowania
- [ ] Przetestować zmianę hasła
- [ ] Przetestować usuwanie konta
- [ ] Przetestować ochronę stron
- [ ] Przetestować przekierowania
- [ ] Przetestować sesje (odświeżenie, wygaśnięcie)

---

**Koniec specyfikacji**

Dokument wygenerowany: 2025-11-16  
Wersja: 1.0  
Status: Do implementacji

