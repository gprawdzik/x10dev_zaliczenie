# CI/CD Setup Checklist

Po zaktualizowaniu workflow, wykonaj poniższe kroki aby uruchomić CI/CD pipeline:

## ✅ Krok 1: Utwórz użytkownika E2E w Supabase

1. Zaloguj się do [Supabase Dashboard](https://supabase.com/dashboard)
2. Wybierz swój projekt
3. Przejdź do: **Authentication** → **Users**
4. Kliknij: **Add user** → **Create new user**
5. Wprowadź dane:
   - **Email:** `e2e-test@yourdomain.com` (lub dowolny email)
   - **Password:** Silne hasło (min. 8 znaków, zapisz je bezpiecznie!)
   - ✅ Zaznacz: **Auto Confirm User**
6. Kliknij: **Create user**
7. **Skopiuj UUID użytkownika** z listy (potrzebny w następnym kroku)

## ✅ Krok 2: Skonfiguruj GitHub Secrets

1. Przejdź do swojego repozytorium na GitHub
2. Kliknij: **Settings** → **Secrets and variables** → **Actions**
3. Kliknij: **New repository secret** i dodaj każdy z poniższych:

### Sekrety do dodania:

| Nazwa | Gdzie znaleźć | Przykład |
|-------|---------------|----------|
| `PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL | `https://xxxxx.supabase.co` |
| `PUBLIC_SUPABASE_KEY` | Supabase Dashboard → Project Settings → API → Project API keys → `anon` `public` | `eyJhbGciOiJIUz...` |
| `E2E_USERNAME` | Email użytkownika utworzonego w Kroku 1 | `e2e-test@yourdomain.com` |
| `E2E_PASSWORD` | Hasło użytkownika z Kroku 1 | `YourSecurePassword123!` |
| `E2E_USERNAME_ID` | UUID użytkownika skopiowane w Kroku 1 | `123e4567-e89b-12d3-a456-426614174000` |

## ✅ Krok 3: Przetestuj pipeline

### Opcja A: Automatyczne uruchomienie (Push)

```bash
git add .
git commit -m "Configure CI/CD pipeline"
git push origin main
```

### Opcja B: Ręczne uruchomienie

1. Przejdź do: **Actions** tab w GitHub
2. Wybierz: **Testing CI** workflow
3. Kliknij: **Run workflow** dropdown
4. Wybierz branch: **main**
5. Kliknij: **Run workflow**

## ✅ Krok 4: Zweryfikuj wyniki

1. Przejdź do: **Actions** tab
2. Kliknij na najnowszy workflow run
3. Sprawdź czy wszystkie **3 joby** są zielone ✅:

   **Job 1: Lint** (2-3 min, parallel)
   - ✅ Checkout code
   - ✅ Setup Node.js
   - ✅ Install dependencies
   - ✅ Run linting

   **Job 2: Test** (7-8 min, parallel)
   - ✅ Checkout code
   - ✅ Setup Node.js
   - ✅ Install dependencies
   - ✅ Run unit tests with coverage
   - ✅ Upload coverage report
   - ✅ Install Playwright browsers
   - ✅ Run E2E tests

   **Job 3: Build** (2-3 min, po lint + test)
   - ✅ Checkout code
   - ✅ Setup Node.js
   - ✅ Install dependencies
   - ✅ Build production
   - ✅ Upload build artifacts

**Total time:** ~8-10 minut (dzięki równoległemu wykonaniu)

## ✅ Krok 5: Pobierz artifacts (opcjonalnie)

Jeśli pipeline przeszedł pomyślnie, możesz pobrać artifacts:

1. Scroll down na stronie workflow run
2. W sekcji **Artifacts** znajdziesz:
   - 📊 **coverage-report** - HTML raport pokrycia kodu
   - 🏗️ **production-build** - Skompilowana aplikacja

Jeśli testy E2E nie powiodły się:
   - 🎭 **playwright-report** - Raport z screenshots i video

## 🎉 Gotowe!

Twój CI/CD pipeline jest skonfigurowany i działa! Każdy push do `main` i każde PR będą automatycznie testowane.

---

## 🔧 Troubleshooting

### Problem: "Failed to sign in teardown user"

**Rozwiązanie:**
- Sprawdź czy `E2E_USERNAME` i `E2E_PASSWORD` są poprawne
- Upewnij się że użytkownik jest potwierdzony (Auto Confirm User ✅)
- Zweryfikuj czy użytkownik istnieje w Supabase Authentication

### Problem: "User ID mismatch"

**Rozwiązanie:**
- Skopiuj ponownie UUID użytkownika z Supabase Dashboard
- Zaktualizuj secret `E2E_USERNAME_ID` w GitHub

### Problem: "Playwright installation timeout"

**Rozwiązanie:**
- To normalnie trwa 2-3 minuty przy pierwszym uruchomieniu
- Pipeline ma 20 minut timeout - powinno wystarczyć
- Jeśli problem się powtarza, otwórz issue

---

## 📚 Dokumentacja

- [CI_CD_SETUP.md](CI_CD_SETUP.md) - Szczegółowa dokumentacja workflow
- [docs/35_ci_cd_configuration.md](../docs/35_ci_cd_configuration.md) - Pełny przewodnik konfiguracji
- [README.md](../README.md) - Główna dokumentacja projektu

## 🏷️ Badge statusu

Dodaj badge do swojego README.md:

```markdown
[![Testing CI](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/test.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/test.yml)
```

Zamień `YOUR_USERNAME/YOUR_REPO` na:
- Właściciel: `gprawdzik`
- Repo: `x10dev_zaliczenie`

(Badge już dodany w README.md! ✅)

