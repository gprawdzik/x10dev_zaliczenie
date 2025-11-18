# Plan Implementacji Mechanizmu Teardown w Playwright

## 1. Wprowadzenie

### 1.1. Cel dokumentu

Niniejszy dokument opisuje szczegółowy plan implementacji mechanizmu **global teardown** w Playwright dla projektu StravaGoals. Mechanizm ten zapewni automatyczne czyszczenie danych testowych (aktywności) po zakończeniu wszystkich testów E2E.

### 1.2. Kontekst biznesowy

Testy E2E generują aktywności testowe w bazie danych Supabase. Bez mechanizmu czyszczenia, te dane:

- Zaśmiecają bazę danych testową
- Mogą wpływać na wyniki kolejnych testów
- Utrudniają debugowanie i analizę wyników testów
- Zwiększają czas wykonywania testów przez nadmiar danych

### 1.3. Zakres implementacji

- Utworzenie pliku konfiguracyjnego `global.teardown.ts`
- Implementacja logiki czyszczenia aktywności dla użytkownika testowego
- Konfiguracja Playwright do użycia teardown
- Aktualizacja dokumentacji testowej
- Walidacja i testy mechanizmu

## 2. Architektura Rozwiązania

### 2.1. Komponenty systemu

```
┌─────────────────────────────────────────┐
│     Playwright Test Runner              │
│  (npm run test:e2e)                     │
└──────────────┬──────────────────────────┘
               │
               ├──► 1. Setup (opcjonalne)
               │
               ├──► 2. Testy E2E
               │    ├─ auth.spec.ts
               │    ├─ activity-generation.spec.ts
               │    └─ ...
               │
               └──► 3. Global Teardown
                    └─ tests/global.teardown.ts
                       └─ Czyszczenie activities
                          przez Supabase Client
```

### 2.2. Przepływ danych

1. **Przed testami**: Użytkownik testowy (E2E_USERNAME_ID) istnieje w bazie danych
2. **Podczas testów**: Testy tworzą aktywności przypisane do E2E_USERNAME_ID
3. **Po testach**: Teardown usuwa wszystkie aktywności dla E2E_USERNAME_ID

### 2.3. Izolacja środowisk

- **Lokalne testy**: używają `.env.test` z dedykowanym projektem Supabase
- **CI/CD**: używają zmiennych środowiskowych z GitHub Secrets
- Teardown działa identycznie w obu środowiskach

## 3. Szczegółowy Plan Implementacji

### 3.1. Etap 1: Utworzenie pliku teardown

#### 3.1.1. Struktura pliku `tests/global.teardown.ts`

```typescript
import { FullConfig } from '@playwright/test'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../src/db/database.types'

/**
 * Global teardown function executed after all tests
 * Cleans up test data from the database
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown...')

  const supabaseUrl = process.env.PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.PUBLIC_SUPABASE_KEY
  const e2eUserId = process.env.E2E_USERNAME_ID

  // Validate environment variables
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials')
    throw new Error('PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_KEY must be set')
  }

  if (!e2eUserId) {
    console.warn('⚠️  E2E_USERNAME_ID not set, skipping teardown')
    return
  }

  console.log(`📋 Cleaning activities for user: ${e2eUserId}`)

  // Create Supabase client
  const supabase: SupabaseClient<Database> = createClient(supabaseUrl, supabaseKey)

  try {
    // Delete all activities for the test user
    const { error, count } = await supabase
      .from('activities')
      .delete({ count: 'exact' })
      .eq('user_id', e2eUserId)

    if (error) {
      console.error('❌ Error deleting activities:', error.message)
      throw error
    }

    console.log(`✅ Successfully deleted ${count ?? 0} activities`)
  } catch (error) {
    console.error('❌ Teardown failed:', error)
    throw error
  } finally {
    console.log('🏁 Global teardown completed')
  }
}

export default globalTeardown
```

#### 3.1.2. Kluczowe elementy implementacji

**A. Walidacja zmiennych środowiskowych**

- Sprawdzenie obecności `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_KEY`
- Sprawdzenie obecności `E2E_USERNAME_ID`
- Rzucenie błędu jeśli brakuje krytycznych zmiennych
- Ostrzeżenie i pominięcie jeśli brakuje E2E_USERNAME_ID (graceful degradation)

**B. Klient Supabase**

- Wykorzystanie typów z `database.types.ts`
- Utworzenie klienta z publicznymi kluczami
- Brak konieczności uwierzytelniania (używamy service key)

**C. Logika czyszczenia**

- Usunięcie wszystkich rekordów z tabeli `activities` dla `user_id = E2E_USERNAME_ID`
- Użycie `count: 'exact'` do raportowania liczby usuniętych rekordów
- Obsługa błędów z odpowiednimi komunikatami

**D. Logging**

- Jasne komunikaty o postępie teardown
- Emoji dla czytelności w konsoli
- Raportowanie liczby usuniętych rekordów

### 3.2. Etap 2: Konfiguracja Playwright

#### 3.2.1. Aktualizacja `playwright.config.ts`

Dodać właściwość `globalTeardown` do konfiguracji:

```typescript
export default defineConfig({
  testDir: './tests/e2e',

  // ... istniejąca konfiguracja ...

  /* Global teardown - cleanup test data after all tests */
  globalTeardown: './tests/global.teardown.ts',

  // ... reszta konfiguracji ...
})
```

#### 3.2.2. Lokalizacja w pliku

- Dodać po `testDir` i przed `timeout`
- Lub w sekcji z innymi globalnymi ustawieniami
- Dodać komentarz wyjaśniający cel

### 3.3. Etap 3: Zmienne środowiskowe

#### 3.3.1. Plik `.env.test` (lokalny development)

Dodać nową zmienną:

```bash
# Existing variables
E2E_USERNAME=test.user@example.com
E2E_PASSWORD=SecureTestPassword123!
PUBLIC_SUPABASE_URL=https://xyz.supabase.co
PUBLIC_SUPABASE_KEY=eyJhbGc...
BASE_URL=http://localhost:4321

# NEW: User ID for E2E teardown
E2E_USERNAME_ID=uuid-of-test-user-from-supabase
```

#### 3.3.2. Jak uzyskać E2E_USERNAME_ID?

**Metoda 1: Query SQL w Supabase Dashboard**

```sql
SELECT id, email FROM auth.users WHERE email = 'test.user@example.com';
```

**Metoda 2: Utworzenie skryptu pomocniczego**

```typescript
// scripts/get-test-user-id.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.PUBLIC_SUPABASE_URL!, process.env.PUBLIC_SUPABASE_KEY!)

const { data } = await supabase.auth.admin.listUsers()
const testUser = data?.users.find((u) => u.email === process.env.E2E_USERNAME)
console.log('E2E_USERNAME_ID:', testUser?.id)
```

#### 3.3.3. Plik `.env.dist` (template)

Zaktualizować template o nowe zmienne:

```bash
# E2E Test Configuration
E2E_USERNAME=your-test-user@example.com
E2E_PASSWORD=YourTestPassword123!
E2E_USERNAME_ID=00000000-0000-0000-0000-000000000000

# Supabase Configuration
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_KEY=your-anon-key
```

### 3.4. Etap 4: Rozszerzenia i optymalizacje

#### 3.4.1. Czyszczenie dodatkowych tabel (opcjonalne)

Jeśli testy tworzą również inne dane, rozszerzyć teardown:

```typescript
// W funkcji globalTeardown, po czyszczeniu activities:

// Clean AI suggestions
const { error: aiError, count: aiCount } = await supabase
  .from('ai_suggestions')
  .delete({ count: 'exact' })
  .eq('user_id', e2eUserId)

if (!aiError) {
  console.log(`✅ Deleted ${aiCount ?? 0} AI suggestions`)
}

// Clean goals (will cascade to goal_history)
const { error: goalsError, count: goalsCount } = await supabase
  .from('goals')
  .delete({ count: 'exact' })
  .eq('user_id', e2eUserId)

if (!goalsError) {
  console.log(`✅ Deleted ${goalsCount ?? 0} goals`)
}
```

#### 3.4.2. Conditional teardown (skip in dev)

Dodać flagę do pomijania teardown w developmencie:

```typescript
const skipTeardown = process.env.SKIP_TEARDOWN === 'true'

if (skipTeardown) {
  console.log('⏭️  Teardown skipped (SKIP_TEARDOWN=true)')
  return
}
```

Użycie:

```bash
SKIP_TEARDOWN=true npm run test:e2e
```

#### 3.4.3. Raportowanie do pliku

Zapisywanie raportu teardown:

```typescript
import { writeFile } from 'fs/promises'
import { join } from 'path'

const report = {
  timestamp: new Date().toISOString(),
  userId: e2eUserId,
  activitiesDeleted: count ?? 0,
  success: !error,
}

await writeFile(
  join(process.cwd(), 'playwright-report', 'teardown-report.json'),
  JSON.stringify(report, null, 2),
)
```

### 3.5. Etap 5: Obsługa błędów

#### 3.5.1. Strategia error handling

```typescript
try {
  // Deletion logic
} catch (error) {
  if (error instanceof Error) {
    console.error('❌ Teardown error:', error.message)

    // Log stack trace for debugging
    if (process.env.DEBUG) {
      console.error(error.stack)
    }
  }

  // Decide: throw or continue
  if (process.env.CI) {
    // In CI, fail the pipeline if teardown fails
    throw error
  } else {
    // Locally, just warn
    console.warn('⚠️  Teardown failed but continuing...')
  }
}
```

#### 3.5.2. Retry mechanism

Dla niestabilnych połączeń sieciowych:

```typescript
async function deleteWithRetry(supabase: SupabaseClient, userId: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { error, count } = await supabase
        .from('activities')
        .delete({ count: 'exact' })
        .eq('user_id', userId)

      if (!error) {
        return { count }
      }

      throw error
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }
      console.warn(`⚠️  Attempt ${attempt} failed, retrying...`)
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
    }
  }
}
```

## 4. Plan Testowania

### 4.1. Testy jednostkowe teardown

#### 4.1.1. Test: Walidacja zmiennych środowiskowych

```typescript
// tests/unit/teardown.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('Teardown environment validation', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should throw if PUBLIC_SUPABASE_URL is missing', () => {
    delete process.env.PUBLIC_SUPABASE_URL
    // Test logic
  })

  it('should throw if PUBLIC_SUPABASE_KEY is missing', () => {
    delete process.env.PUBLIC_SUPABASE_KEY
    // Test logic
  })

  it('should skip gracefully if E2E_USERNAME_ID is missing', () => {
    delete process.env.E2E_USERNAME_ID
    // Should not throw
  })
})
```

### 4.2. Testy integracyjne

#### 4.2.1. Test: Czyszczenie aktywności

Scenariusz:

1. Utworzyć użytkownika testowego
2. Utworzyć 10 testowych aktywności
3. Uruchomić teardown
4. Sprawdzić, czy wszystkie aktywności zostały usunięte

```bash
# Manual test
npm run test:e2e -- auth.spec.ts
# Check database manually
# Run: node tests/manual/verify-teardown.js
```

#### 4.2.2. Test: Zachowanie przy błędach sieci

Symulować błędy sieci i sprawdzić retry mechanism.

### 4.3. Testy E2E z teardown

#### 4.3.1. Weryfikacja w CI/CD

Po implementacji uruchomić pełny pipeline:

```bash
npm run test:e2e
```

Sprawdzić:

- ✅ Testy przechodzą
- ✅ Teardown wykonuje się po wszystkich testach
- ✅ Logi zawierają komunikaty teardown
- ✅ Baza danych jest pusta po testach

### 4.4. Scenariusze testowe

| ID    | Scenariusz                     | Oczekiwany rezultat           |
| ----- | ------------------------------ | ----------------------------- |
| TD-01 | Teardown z 0 aktywnościami     | Sukces, usunięto 0 rekordów   |
| TD-02 | Teardown z 100 aktywnościami   | Sukces, usunięto 100 rekordów |
| TD-03 | Teardown bez E2E_USERNAME_ID   | Skip z ostrzeżeniem           |
| TD-04 | Teardown z błędnym URL         | Błąd z komunikatem            |
| TD-05 | Teardown z błędnym kluczem API | Błąd autoryzacji              |
| TD-06 | Teardown w CI                  | Wykonuje się i raportuje      |

## 5. Bezpieczeństwo

### 5.1. Ochrona przed przypadkowym usunięciem danych produkcyjnych

**Walidacja środowiska:**

```typescript
// Dodać w teardown:
const isProduction = process.env.NODE_ENV === 'production'
const isTestDb = supabaseUrl.includes('test') || supabaseUrl.includes('staging')

if (isProduction && !isTestDb) {
  throw new Error('🛑 CRITICAL: Teardown blocked - production database detected!')
}
```

### 5.2. Wykorzystanie Service Role Key

Dla teardown **nie używać** `PUBLIC_SUPABASE_KEY` (anon key), lecz:

```typescript
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PUBLIC_SUPABASE_KEY
```

Powody:

- Service role key ma pełne uprawnienia
- Nie wymaga RLS (Row Level Security)
- Umożliwia bezpośrednie usuwanie bez autoryzacji użytkownika

**Uwaga:** Service role key musi być przechowywany w secrets, nigdy w kodzie!

### 5.3. Ograniczenie zakresu usuwania

Zawsze używać `eq('user_id', e2eUserId)`:

```typescript
// ✅ DOBRZE - usuwa tylko dla E2E użytkownika
.eq('user_id', e2eUserId)

// ❌ ŹLE - usuwa wszystko!
// .delete()
```

## 6. Monitorowanie i Debugging

### 6.1. Logi teardown

Dodać szczegółowe logi:

```typescript
console.log('🧹 Teardown started at:', new Date().toISOString())
console.log('📊 Config:', {
  baseURL: config.use?.baseURL,
  workers: config.workers,
  retries: config.retries,
})
console.log('👤 User ID:', e2eUserId)
console.log('🗄️  Database:', supabaseUrl)
```

### 6.2. Debug mode

```typescript
const DEBUG = process.env.DEBUG === 'true'

if (DEBUG) {
  // Wyświetl wszystkie zmienne środowiskowe
  console.log('Environment:', process.env)

  // Wyświetl szczegóły odpowiedzi Supabase
  const { data, error, count } = await supabase
    .from('activities')
    .delete({ count: 'exact' })
    .eq('user_id', e2eUserId)

  console.log('Supabase response:', { data, error, count })
}
```

Użycie:

```bash
DEBUG=true npm run test:e2e
```

### 6.3. Metryki

Zbierać metryki teardown:

- Czas wykonania
- Liczba usuniętych rekordów
- Liczba błędów
- Liczba retry

```typescript
const startTime = Date.now()

// ... teardown logic ...

const duration = Date.now() - startTime
console.log(`⏱️  Teardown completed in ${duration}ms`)
```

## 7. Dokumentacja

### 7.1. Aktualizacja README.md

Dodać sekcję:

```markdown
### Teardown testowy

Po zakończeniu testów E2E, mechanizm teardown automatycznie czyści dane testowe:

- Wszystkie aktywności utworzone przez użytkownika testowego
- (opcjonalnie) Sugestie AI
- (opcjonalnie) Cele

Aby pominąć teardown lokalnie:
\`\`\`bash
SKIP_TEARDOWN=true npm run test:e2e
\`\`\`
```

### 7.2. Aktualizacja tests/README.md

Dodać szczegółową sekcję o teardown:

```markdown
## Global Teardown

Plik `tests/global.teardown.ts` jest automatycznie wykonywany po wszystkich testach.

### Wymagane zmienne środowiskowe:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_KEY`
- `E2E_USERNAME_ID`

### Debugowanie:

\`\`\`bash
DEBUG=true npm run test:e2e
\`\`\`
```

### 7.3. Komentarze w kodzie

Każda funkcja w `global.teardown.ts` powinna mieć JSDoc:

```typescript
/**
 * Deletes all activities for the specified user ID
 * @param supabase - Supabase client instance
 * @param userId - User ID to delete activities for
 * @returns Number of deleted records
 * @throws {Error} If deletion fails
 */
async function deleteActivities(supabase: SupabaseClient, userId: string): Promise<number> {
  // ...
}
```

## 8. Harmonogram Implementacji

### Faza 1: Podstawowa implementacja (2-3 godziny)

- ✅ Utworzenie `tests/global.teardown.ts`
- ✅ Konfiguracja `playwright.config.ts`
- ✅ Dodanie `E2E_USERNAME_ID` do `.env.test`
- ✅ Podstawowe testy manualne

### Faza 2: Rozszerzenia (1-2 godziny)

- ✅ Czyszczenie dodatkowych tabel
- ✅ Retry mechanism
- ✅ Lepsze error handling
- ✅ Conditional teardown

### Faza 3: Dokumentacja (1 godzina)

- ✅ Aktualizacja README.md
- ✅ Aktualizacja tests/README.md
- ✅ JSDoc w kodzie

### Faza 4: Walidacja i CI/CD (1 godzina)

- ✅ Testy w CI/CD
- ✅ Konfiguracja GitHub Secrets
- ✅ Weryfikacja logów

**Łączny czas: 5-7 godzin**

## 9. Kryteria Akceptacji

### 9.1. Funkcjonalność

- [ ] Teardown usuwa wszystkie aktywności dla E2E_USERNAME_ID
- [ ] Teardown wykonuje się automatycznie po testach
- [ ] Teardown działa lokalnie i w CI/CD
- [ ] Teardown raportuje liczbę usuniętych rekordów
- [ ] Teardown obsługuje błędy gracefully

### 9.2. Bezpieczeństwo

- [ ] Teardown nie działa na produkcji
- [ ] Teardown używa prawidłowych kluczy API
- [ ] Teardown usuwa tylko dane E2E użytkownika

### 9.3. Dokumentacja

- [ ] README.md zaktualizowany
- [ ] tests/README.md zaktualizowany
- [ ] Kod zawiera JSDoc comments
- [ ] `.env.dist` zawiera nowe zmienne

### 9.4. Testy

- [ ] Teardown przetestowany manualnie
- [ ] Teardown przetestowany w CI/CD
- [ ] Scenariusze błędów przetestowane

## 10. Ryzyka i Mitygacje

| Ryzyko                         | Prawdopodobieństwo | Wpływ     | Mitygacja                         |
| ------------------------------ | ------------------ | --------- | --------------------------------- |
| Usunięcie danych produkcyjnych | Niskie             | Krytyczny | Walidacja środowiska, osobne bazy |
| Teardown nie wykonuje się      | Średnie            | Wysoki    | Logi, monitoring, testy           |
| Teardown zawiesza się          | Niskie             | Średni    | Timeout, retry mechanism          |
| Błędy sieci                    | Średnie            | Średni    | Retry mechanism, error handling   |
| Brak uprawnień w Supabase      | Niskie             | Wysoki    | Użycie service role key           |

## 11. Monitorowanie Sukcesu

### 11.1. Metryki KPI

- **Czas wykonania teardown**: < 5 sekund
- **Success rate**: > 99%
- **Liczba błędów**: < 1%
- **Czas debugowania**: zmniejszenie o 50%

### 11.2. Narzędzia monitorowania

- Logi Playwright (`playwright-report/`)
- Logi CI/CD (GitHub Actions)
- Supabase Dashboard (monitoring queries)

## 12. Przyszłe Ulepszenia

### 12.1. Faza 2 (opcjonalne)

- **Global Setup**: Utworzenie użytkownika testowego przed testami
- **Data Seeding**: Przygotowanie danych testowych (sports, sample goals)
- **Parallel Isolation**: Osobne użytkownicy dla parallel workers
- **Snapshot Testing**: Zapisywanie stanu bazy przed/po testach

### 12.2. Faza 3 (zaawansowane)

- **Database Transactions**: Rollback całego testu jako transakcja
- **Docker Compose**: Dedykowana baza dla każdego uruchomienia testów
- **Supabase Local**: Lokalna instancja Supabase dla testów

## 13. Kontakt i Wsparcie

W razie pytań lub problemów:

- Sprawdź logi teardown w `playwright-report/`
- Uruchom z `DEBUG=true`
- Sprawdź Supabase Dashboard
- Skonsultuj z zespołem QA
