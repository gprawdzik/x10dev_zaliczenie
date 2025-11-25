# CI/CD Setup Documentation

## Overview

Ten projekt wykorzystuje GitHub Actions do automatycznego uruchamiania testów i budowania aplikacji przy każdym push/PR do branch `main`.

## Pipeline Steps

Workflow `test.yml` składa się z 3 niezależnych jobów:

### Job 1: Lint (runs parallel)

- Sprawdzenie jakości kodu (oxlint + eslint)
- Timeout: 5 minut
- Czas: ~2-3 min

### Job 2: Test (runs parallel)

- Unit tests z pokryciem kodu (Vitest)
- E2E tests (Playwright)
- Upload artifacts (coverage + playwright reports)
- Timeout: 15 minut
- Czas: ~7-8 min

### Job 3: Build (runs after lint + test)

- Production build (astro check + build)
- Upload build artifacts
- Timeout: 10 minut
- Czas: ~2-3 min
- **Wymaga:** Sukces jobów lint i test

**Total pipeline time:** ~8-10 minut dzięki równoległemu wykonaniu

## Required GitHub Secrets

Aby pipeline działał poprawnie, musisz skonfigurować następujące sekrety w repozytorium GitHub:

### Nawigacja do GitHub Secrets

`Settings` → `Secrets and variables` → `Actions` → `New repository secret`

### Wymagane Sekrety

| Secret Name           | Opis                                  | Przykład                                  |
| --------------------- | ------------------------------------- | ----------------------------------------- |
| `PUBLIC_SUPABASE_URL` | URL instancji Supabase                | `https://xxxxx.supabase.co`               |
| `PUBLIC_SUPABASE_KEY` | Anon/Public key z Supabase            | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `E2E_USERNAME`        | Email użytkownika testowego E2E       | `e2e-test@example.com`                    |
| `E2E_PASSWORD`        | Hasło użytkownika testowego E2E       | `TestPassword123!`                        |
| `E2E_USERNAME_ID`     | UUID użytkownika testowego w Supabase | `123e4567-e89b-12d3-a456-426614174000`    |

## Setup E2E Test User

1. Zaloguj się do Supabase Dashboard
2. Przejdź do `Authentication` → `Users`
3. Utwórz nowego użytkownika z credentialami które zapiszesz jako `E2E_USERNAME` i `E2E_PASSWORD`
4. Skopiuj UUID użytkownika jako `E2E_USERNAME_ID`
5. Dodaj wszystkie wartości jako GitHub Secrets

## Local Development

Aby uruchomić testy lokalnie, utwórz plik `.env.test`:

```bash
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
E2E_USERNAME=e2e-test@example.com
E2E_PASSWORD=TestPassword123!
E2E_USERNAME_ID=123e4567-e89b-12d3-a456-426614174000
```

**⚠️ Uwaga:** Plik `.env.test` jest dodany do `.gitignore` i nie powinien być commitowany.

## Pipeline Artifacts

Workflow generuje następujące artefakty:

### Coverage Report

- **Nazwa:** `coverage-report`
- **Dostępność:** Zawsze (nawet przy niepowodzeniu)
- **Retencja:** 30 dni
- **Zawartość:** Raport pokrycia kodu testami jednostkowymi

### Playwright Report

- **Nazwa:** `playwright-report`
- **Dostępność:** Tylko przy niepowodzeniu testów E2E
- **Retencja:** 30 dni
- **Zawartość:** Screenshoty, video, trace z nieudanych testów

### Production Build

- **Nazwa:** `production-build`
- **Dostępność:** Tylko przy sukcesie
- **Retencja:** 7 dni
- **Zawartość:** Skompilowana aplikacja gotowa do deploy

## Troubleshooting

### E2E Tests Failing in CI

1. Sprawdź czy wszystkie sekrety są ustawione w GitHub
2. Zweryfikuj czy użytkownik E2E istnieje w Supabase
3. Upewnij się że UUID użytkownika jest poprawne

### Build Failing

1. Sprawdź logi TypeScript (`astro check`)
2. Upewnij się że wszystkie dependencies są zainstalowane
3. Zweryfikuj kompatybilność wersji Node.js (wymagane: ^20.19.0 || >=22.12.0)

### Playwright Installation Issues

Pipeline instaluje tylko przeglądarkę Chromium z zależnościami systemowymi (`--with-deps`).
Jeśli występują problemy, sprawdź logi kroku "Install Playwright browsers".

## Manual Trigger

Workflow można uruchomić ręcznie poprzez:
`Actions` → `Testing CI` → `Run workflow` → `Run workflow`

## Performance

- **Timeout:** 20 minut (cały job)
- **Średni czas wykonania:** ~5-10 minut
- **Workers (E2E):** 1 (na CI dla stabilności)
- **Retries (E2E):** 2 (tylko na CI)
