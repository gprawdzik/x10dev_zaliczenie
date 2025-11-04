# Architektura UI dla StravaGoals

## 1. Przegląd struktury UI

Aplikacja StravaGoals składa się z sześciu głównych widoków i dwóch modalnych rozszerzeń, połączonych prostą nawigacją bottom-navbar (mobile) lub top-navbar (desktop). Kluczowe zasady projektowe to:

* prostota i spójność dzięki bibliotece shadcn/vue oraz Tailwind 4
* responsywność: układ 1 × N (mobile) i ≥ 2 kolumn (desktop)
* dostępność: ARIA, focus-states, wysoki kontrast w dark-mode
* bezpieczeństwo: każda interakcja wymaga ważnej sesji Supabase; brak danych offline

## 2. Lista widoków

| Nazwa widoku | Ścieżka | Główny cel | Kluczowe informacje | Kluczowe komponenty | UX / dostępność / bezpieczeństwo |
|--------------|---------|------------|---------------------|---------------------|----------------------------------|
| Ekran logowania | `/login` | Umożliwia uwierzytelnienie użytkownika | Pola **email**, **hasło**, link „Rejestracja” | `AuthForm`, `Button` | Walidacja klienta + serwera, disabled state przy ładowaniu, focus-trap w formularzu |
| Rejestracja | `/register` | Zakłada konto | Pola **email**, **hasło**, **potwierdź hasło** | `AuthForm`, `Button` | Spójna walidacja, komunikat toast przy sukcesie/ błędzie |
| Dashboard „Moje cele” | `/` | Pokazuje bieżący postęp i listę celów | Wykres kumulatywny, karty celów (plan, wykonanie, %) | `ProgressChart`, `GoalCard`, `BottomNavBar` / `TopNavBar`, `Toast`, `SkeletonRow` | Lazy loading wykresu, paginacja kart, skeletony, dark-mode |
| Historia | `/history` | Przegląd cel vs wykonanie dla poprzednich lat | Wybór lat, zbiorczy wykres porównawczy, tabela roczna | `HistoryChart`, `YearSelector`, `PaginationButton` | ARIA dla selektora, czytelny kontrast wykresów |
| Ustawienia | `/settings` | Konfiguracja profilu i generowanie danych | Zakładki: **Profil**, **Generator danych** | `Tabs`, `ProfileForm`, `ActivityGeneratorPanel`, `Loader`, `Toast` | Ochrona przed przypadkowym uruchomieniem generatora (modal potwierdzenia) |
| Strona 404 | `/404` (fallback) | Informuje o nieistniejącej ścieżce | Tekst, link powrotny | `ErrorIllustration`, `Button` | Brak wrażliwych danych |
| Modal „Historia celu” | `modal:/goal/:id/history` | Szczegóły zmian konkretnego celu | Wykres wersji, tabela zmian | `GoalHistoryChart`, `DataTable`, `Modal`, `PaginationButton` | Focus-trap, ESC do zamknięcia |
| Modal „Sugestie AI” | `modal:/ai-suggestions` | Lista propozycji nowych celów | Tabela sugestii, przyciski **Akceptuj / Odrzuć** | `AISuggestionCard`, `Modal`, `Button`, `Toast` | Blokada podwójnego kliknięcia, optimistyczny loader w przyciskach |

## 3. Mapa podróży użytkownika

1. **Anonimowy użytkownik** otwiera `/login` → wprowadza dane → **Supabase Auth** → przekierowanie na `/`.
2. Na **Dashboardzie** ładowane są równolegle: lista celów (`GET /goals`) i wykres postępu (`POST /functions/progress-annual`).  
   • Użytkownik przewija listę (paginacja „Załaduj więcej”).  
   • Kliknięcie karty celu otwiera modal „Historia celu” (`GET /goal_history`).  
   • Kliknięcie „Pokaż sugestie” wywołuje `POST /functions/ai-suggestions-generate`, po czym modal „Sugestie AI” (`GET /ai_suggestions`).  
   • Akceptacja sugestii → `POST /functions/ai-suggestions-accept` → reload `GET /goals`.
3. Użytkownik przechodzi do **Historia** (`/history`) z bottom/top-navbar.  
   • Wybiera lata i sortowanie → `POST /functions/progress-history`.
4. W **Ustawieniach** (`/settings`) użytkownik w zakładce **Generator danych** uruchamia symulację (`POST /functions/activities-generate`) z loaderem pełnoekranowym + toast.
5. Użytkownik może się wylogować z menu → `supabase.auth.signOut()` → redirect `/login`.

## 4. Układ i struktura nawigacji

* **Mobile**: `BottomNavBar` (ikony **Cele**, **Historia**, **Ustawienia**).  
  – Ukrywa się, gdy wciśnięta jest klawiatura lub modal na wierzchu.  
* **Desktop**: `TopNavBar` (logo + linki tekstowe).  
* **Router**: Astro file-based; każdy widok to plik `.astro`.  
  – Vue components używają `client:visible`/`client:idle` do hydratacji.

## 5. Kluczowe komponenty

* `AuthForm` – wspólny formularz logowania/rejestracji z walidacją z validators/
* `TopNavBar` / `BottomNavBar` – adaptacyjne paski nawigacji
* `GoalCard` – karta celu z danymi plan / wykonanie, klik → modal historyczny
* `ProgressChart` – kumulatywny wykres roku (biblioteka TBD)  
  – property: `series`, `targetValue`
* `HistoryChart` – porównanie wielu lat
* `GoalHistoryChart` – wykres zmian pojedynczego celu
* `AISuggestionCard` – panel propozycji z przyciskami akcji
* `Tabs` – zakładki w ustawieniach
* `Loader` – pełnoekranowy i inline spinner
* `Toast` – globalny system powiadomień (sukces / błąd)
* `SkeletonRow` – placeholder listy podczas ładowania
* `PaginationButton` – mechanizm „Załaduj więcej”
* `Modal` – dostępny modal bazowy z focus-trap i ESC

---

> Dokument stanowi podstawę implementacji widoków i komponentów w ramach MVP StravaGoals. Nierozstrzygnięte kwestie (wybór biblioteki wykresów, szczegóły tabel w modalach) zostaną doprecyzowane w dedykowanych zadaniach.
