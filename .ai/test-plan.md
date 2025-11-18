Zaczynam od analizy projektu, aby stworzyć kompleksowy plan testów. W tym celu zapoznam się z wymaganiami produktu, stosem technologicznym i strukturą kodu. Najpierw sprawdzę zawartość katalogu `src`, żeby zrozumieć ogólną budowę aplikacji.

[1 tool called]

Okay, I've analyzed the project based on the provided documentation and codebase structure. Here is the comprehensive test plan you requested.

# Plan Testów dla Aplikacji StravaGoals

## 1. Wprowadzenie i cele testowania

### 1.1. Wprowadzenie

Niniejszy dokument opisuje plan testów dla aplikacji StravaGoals. Celem jest zapewnienie wysokiej jakości produktu poprzez systematyczne testowanie wszystkich kluczowych funkcjonalności, od uwierzytelniania użytkownika, przez zarządzanie celami i aktywnościami, po integrację z usługami zewnętrznymi.

### 1.2. Cele testowania

- **Weryfikacja funkcjonalności**: Upewnienie się, że wszystkie funkcje opisane w dokumencie wymagań produktu (PRD) działają zgodnie z oczekiwaniami.
- **Zapewnienie jakości**: Identyfikacja i raportowanie błędów w celu ich naprawy przed wdrożeniem na produkcję.
- **Walidacja UI/UX**: Sprawdzenie, czy interfejs użytkownika jest intuicyjny, spójny i responsywny.
- **Ocena stabilności**: Zapewnienie, że aplikacja jest stabilna i radzi sobie z obsługą błędów oraz nietypowymi scenariuszami użytkowania.
- **Weryfikacja bezpieczeństwa**: Sprawdzenie podstawowych aspektów bezpieczeństwa, zwłaszcza w kontekście uwierzytelniania i autoryzacji.

## 2. Zakres testów

### 2.1. Funkcjonalności objęte testami

- Moduł uwierzytelniania (rejestracja, logowanie, wylogowanie, zmiana hasła, odzyskiwanie konta).
- Zarządzanie celami rocznymi (CRUD).
- Generator aktywności.
- Wyświetlanie aktywności z paginacją i sortowaniem.
- Wizualizacje postępów i historii celów.
- Sugestie AI (generowanie, akceptacja, odrzucenie).
- Zarządzanie sportami (dodawanie przez administratora).
- Ustawienia użytkownika (zmiana hasła, usuwanie konta).
- Mechanizm teardown (automatyczne czyszczenie danych testowych).

### 2.2. Funkcjonalności wyłączone z testów

- Testy wydajnościowe na dużą skalę.
- Testy penetracyjne.
- Bezpośrednie testy infrastruktury Supabase oraz API Openrouter.ai (testujemy integrację, nie samą usługę).

## 3. Typy testów do przeprowadzenia

- **Testy jednostkowe (Unit Tests)**: Weryfikacja małych, izolowanych fragmentów kodu (np. funkcje pomocnicze w `src/lib`, walidatory Zod w `src/validators`, logika w composables).
- **Testy komponentów (Component Tests)**: Testowanie komponentów Vue w izolacji, sprawdzanie ich renderowania, interakcji i logiki.
- **Testy integracyjne (Integration Tests)**: Weryfikacja współpracy między różnymi częściami systemu (np. serwis `src/services/activities.ts` z klientem Supabase, komponent z Pinia store).
- **Testy End-to-End (E2E Tests)**: Symulacja pełnych scenariuszy użytkownika w przeglądarce, od logowania po realizację celu.
- **Testy regresji (Regression Testing)**: Uruchamianie istniejącego zestawu testów po każdej zmianie w kodzie, aby upewnić się, że nowe zmiany nie zepsuły istniejących funkcjonalności.
- **Testy manualne (Manual Testing)**: Eksploracyjne testowanie aplikacji w celu znalezienia błędów, które mogły zostać pominięte w testach automatycznych.

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1. Uwierzytelnianie

- **TC-AUTH-01**: Pomyślna rejestracja nowego użytkownika.
- **TC-AUTH-02**: Próba rejestracji z istniejącym adresem e-mail.
- **TC-AUTH-03**: Pomyślne logowanie z poprawnymi danymi.
- **TC-AUTH-04**: Próba logowania z niepoprawnym hasłem.
- **TC-AUTH-05**: Pomyślne wylogowanie.
- **TC-AUTH-06**: Ochrona tras - próba dostępu do chronionej strony (`/goals`) bez zalogowania (oczekiwane przekierowanie do `/auth/login`).
- **TC-AUTH-07**: Pomyślna zmiana hasła przez zalogowanego użytkownika.
- **TC-AUTH-08**: Pomyślne zainicjowanie procesu odzyskiwania hasła.

### 4.2. Zarządzanie celami

- **TC-GOAL-01**: Pomyślne utworzenie nowego celu rocznego.
- **TC-GOAL-02**: Walidacja formularza celu (np. próba zapisu z niepoprawnymi danymi).
- **TC-GOAL-03**: Pomyślna edycja istniejącego celu.
- **TC-GOAL-04**: Pomyślne usunięcie celu.
- **TC-GOAL-05**: Weryfikacja, czy historia zmian celu jest poprawnie zapisywana.

### 4.3. Aktywności

- **TC-ACT-01**: Pomyślne wygenerowanie 100 symulowanych aktywności.
- **TC-ACT-02**: Poprawne wyświetlanie listy aktywności.
- **TC-ACT-03**: Poprawne działanie paginacji na liście aktywności.
- **TC-ACT-04**: Poprawne działanie sortowania na liście aktywności.

### 4.4. Sugestie AI

- **TC-AI-01**: Pomyślne wygenerowanie sugestii AI.
- **TC-AI-02**: Pomyślna akceptacja sugestii (utworzenie/aktualizacja celu).
- **TC-AI-03**: Pomyślne odrzucenie sugestii.
- **TC-AI-04**: Obsługa błędu, gdy API Openrouter.ai jest niedostępne.

### 4.5. Mechanizm Teardown

- **TC-TEARDOWN-01**: Pomyślne usunięcie wszystkich aktywności użytkownika testowego po zakończeniu testów.
- **TC-TEARDOWN-02**: Weryfikacja, że teardown nie usuwa danych innych użytkowników.
- **TC-TEARDOWN-03**: Graceful handling gdy `E2E_USERNAME_ID` nie jest ustawione (pominięcie z ostrzeżeniem).
- **TC-TEARDOWN-04**: Obsługa błędów połączenia z bazą danych podczas teardown.
- **TC-TEARDOWN-05**: Weryfikacja, że teardown wykonuje się automatycznie po wszystkich testach E2E.
- **TC-TEARDOWN-06**: Weryfikacja raportowania liczby usuniętych rekordów w logach.

## 5. Środowisko testowe

- **Lokalne środowisko deweloperskie**: Do uruchamiania testów jednostkowych, komponentowych i integracyjnych podczas rozwoju.
- **Środowisko CI (GitHub Actions)**: Automatyczne uruchamianie wszystkich testów (jednostkowych, integracyjnych, E2E) po każdym pushu do repozytorium.
- **Baza danych**: Dedykowana instancja/projekt Supabase do testów E2E i integracyjnych, aby izolować dane testowe od deweloperskich.

### 5.1. Mechanizm Teardown (Czyszczenie Danych Testowych)

Aby zapewnić czystość środowiska testowego i uniknąć interferencji między testami, zaimplementowano mechanizm **Global Teardown** w Playwright:

#### 5.1.1. Cel i Zakres

- **Automatyczne czyszczenie**: Po zakończeniu wszystkich testów E2E, system automatycznie usuwa dane testowe z bazy danych.
- **Zakres czyszczenia**: Usuwane są wszystkie aktywności przypisane do użytkownika testowego (identyfikowanego przez `E2E_USERNAME_ID`).
- **Bezpieczeństwo**: Mechanizm działa wyłącznie w środowisku testowym i jest zabezpieczony przed przypadkowym usunięciem danych produkcyjnych.

#### 5.1.2. Konfiguracja

Wymagane zmienne środowiskowe w `.env.test`:

- `E2E_USERNAME` - email użytkownika testowego
- `E2E_PASSWORD` - hasło użytkownika testowego
- `E2E_USERNAME_ID` - UUID użytkownika testowego w Supabase
- `PUBLIC_SUPABASE_URL` - URL projektu Supabase
- `PUBLIC_SUPABASE_KEY` - klucz API Supabase (preferowany: service role key)

#### 5.1.3. Działanie

1. Testy E2E tworzą dane testowe (aktywności, cele, sugestie AI)
2. Po zakończeniu wszystkich testów uruchamia się `tests/global.teardown.ts`
3. Teardown łączy się z bazą danych Supabase
4. Wszystkie aktywności dla użytkownika `E2E_USERNAME_ID` są usuwane
5. W logach pojawia się raport z liczbą usuniętych rekordów

#### 5.1.4. Opcje Konfiguracji

- **Pominięcie teardown lokalnie**: `SKIP_TEARDOWN=true npm run test:e2e`
- **Tryb debug**: `DEBUG=true npm run test:e2e`
- **Rozszerzenie**: Możliwość czyszczenia dodatkowych tabel (ai_suggestions, goals)

#### 5.1.5. Monitorowanie

- Logi teardown są zapisywane w konsoli podczas wykonywania testów
- W trybie debug dostępne są szczegółowe informacje o operacjach bazy danych
- Opcjonalnie: raport teardown zapisywany w `playwright-report/teardown-report.json`

Szczegółowy plan implementacji dostępny w: `.ai/test-teardown-plan.md`

## 6. Narzędzia do testowania

- **Framework do testów jednostkowych i komponentowych**: **Vitest** (już skonfigurowany).
- **Framework do testów E2E**: **Playwright**.
- **Biblioteka do testowania komponentów Vue**: **Vue Test Utils**.
- **Biblioteka do mockowania**: **`vi` z Vitest** do mockowania modułów i API.
- **CI/CD**: **GitHub Actions**.
- **Mechanizm Teardown**: **Playwright Global Teardown** do automatycznego czyszczenia danych testowych.

## 7. Harmonogram testów

- **Testy jednostkowe i komponentowe**: Pisane na bieżąco przez deweloperów wraz z nowymi funkcjonalnościami.
- **Testy E2E**: Dodawane dla każdego nowego user story przed jego zakończeniem.
- **Testy regresji**: Uruchamiane automatycznie w pipeline CI/CD przy każdym pushu i przed każdym wdrożeniem.
- **Testy manualne**: Przeprowadzane przed każdym wydaniem nowej wersji aplikacji.

## 8. Kryteria akceptacji testów

### 8.1. Kryteria wejścia

- Dostępna jest dokumentacja wymagań (PRD).
- Funkcjonalność jest zaimplementowana i dostępna w środowisku testowym.
- Środowisko testowe jest skonfigurowane i stabilne.

### 8.2. Kryteria wyjścia

- Wszystkie zdefiniowane scenariusze testowe zostały wykonane.
- Wszystkie testy automatyczne przechodzą pomyślnie (zielony build w CI).
- Nie ma żadnych otwartych błędów krytycznych ani blokujących.
- Gęstość znanych błędów o niższym priorytecie jest na akceptowalnym poziomie.
- Mechanizm teardown działa poprawnie i czyści dane testowe po zakończeniu testów.

## 9. Role i odpowiedzialności w procesie testowania

- **Deweloperzy**: Odpowiedzialni za pisanie testów jednostkowych i komponentowych dla swojego kodu. Naprawiają błędy zgłoszone przez QA.
- **Inżynier QA**: Odpowiedzialny za tworzenie i utrzymanie planu testów, pisanie testów E2E, przeprowadzanie testów manualnych, raportowanie błędów i weryfikację poprawek.
- **Product Owner**: Odpowiedzialny za dostarczenie kryteriów akceptacji dla historyjek użytkownika i udział w testach akceptacyjnych.

## 10. Procedury raportowania błędów

- Wszystkie błędy będą raportowane jako "Issues" w repozytorium GitHub.
- Każdy raport błędu powinien zawierać:
  - **Tytuł**: Krótki, zwięzły opis problemu.
  - **Opis**: Szczegółowy opis błędu, w tym kroki do jego odtworzenia.
  - **Oczekiwany rezultat**: Co powinno się stać.
  - **Rzeczywisty rezultat**: Co się stało.
  - **Środowisko**: Wersja przeglądarki, system operacyjny.
  - **Priorytet**: (Krytyczny, Wysoki, Średni, Niski).
  - **Załączniki**: Zrzuty ekranu, nagrania wideo, logi z konsoli.
