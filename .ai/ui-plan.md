# Architektura UI dla StravaGoals

## 1. Przegląd struktury UI

Aplikacja StravaGoals składa się z siedmiu głównych widoków i dwóch modalnych rozszerzeń, połączonych prostą nawigacją bottom-navbar (mobile) lub top-navbar (desktop). Kluczowe zasady projektowe to:

- prostota i spójność dzięki bibliotece shadcn/vue oraz Tailwind 4
- responsywność: układ 1 × N (mobile) i ≥ 2 kolumn (desktop)
- dostępność: ARIA, focus-states, wysoki kontrast w dark-mode
- bezpieczeństwo: każda interakcja wymaga ważnej sesji Supabase; brak danych offline

## 2. Lista widoków |

- **Ekran logowania** (`/login`)
  • Cel: Umożliwia uwierzytelnienie użytkownika  
  • Kluczowe informacje: Pola **email**, **hasło**, link „Rejestracja”  
  • Kluczowe komponenty: `AuthForm`, `Button`  
  • UX / dostępność / bezpieczeństwo: Walidacja klienta + serwera, disabled state przy ładowaniu, focus-trap w formularzu

- **Rejestracja** (`/register`)
  • Cel: Zakłada konto  
  • Kluczowe informacje: Pola **email**, **hasło**, **potwierdź hasło**  
  • Kluczowe komponenty: `AuthForm`, `Button`  
  • UX / dostępność / bezpieczeństwo: Spójna walidacja, komunikat toast przy sukcesie/ błędzie

- **Dashboard „Moje cele”** (`/`)
  • Cel: Pokazuje bieżący postęp i listę celów  
  • Kluczowe informacje: Wykres kumulatywny, karty celów (plan, wykonanie, %)  
  • Kluczowe komponenty: `ProgressChart`, `GoalCard`, `BottomNavBar` / `TopNavBar`, `Toast`, `SkeletonRow`  
  • UX / dostępność / bezpieczeństwo: Lazy loading wykresu, paginacja kart, skeletony, dark-mode

- **Historia** (`/history`)
  • Cel: Przegląd cel vs wykonanie dla poprzednich lat  
  • Kluczowe informacje: Wybór lat, zbiorczy wykres porównawczy, tabela roczna  
  • Kluczowe komponenty: `HistoryChart`, `YearSelector`, `PaginationButton`  
  • UX / dostępność / bezpieczeństwo: ARIA dla selektora, czytelny kontrast wykresów

- **Moje aktywności** (`/activities`)
  • Cel: Umożliwia przeglądanie wygenerowanych aktywności treningowych
  • Kluczowe informacje: Tabela z aktywnościami (nazwa, typ, data, dystans, czas trwania), paginacja, opcje sortowania
  • Kluczowe komponenty: `ActivitiesTable`, `PaginationControl`, `SortDropdown`
  • UX / dostępność / bezpieczeństwo: Lazy loading danych, skeleton state dla tabeli, ARIA atrybuty dla sortowania i paginacji

- **Ustawienia** (`/settings`)
  • Cel: Konfiguracja profilu, generowanie danych i zarządzanie sportami  
  • Kluczowe informacje: Zakładki: **Profil**, **Generator danych**, **Sporty** (admin)  
  • Kluczowe komponenty: `Tabs`, `ProfileForm`, `ActivityGeneratorPanel`, `SportManagerPanel`, `Loader`, `Toast`  
  • UX / dostępność / bezpieczeństwo: Ochrona przed przypadkowym uruchomieniem generatora (modal potwierdzenia); autoryzacja roli **admin** dla zakładki **Sporty**

- **Strona 404** (`/404`)
  • Cel: Informuje o nieistniejącej ścieżce  
  • Kluczowe informacje: Tekst, link powrotny  
  • Kluczowe komponenty: `ErrorIllustration`, `Button`  
  • UX / dostępność / bezpieczeństwo: Brak wrażliwych danych

- **Modal „Historia celu”** (`modal:/goal/:id/history`)
  • Cel: Szczegóły zmian konkretnego celu  
  • Kluczowe informacje: Wykres wersji, tabela zmian  
  • Kluczowe komponenty: `GoalHistoryChart`, `DataTable`, `Modal`, `PaginationButton`  
  • UX / dostępność / bezpieczeństwo: Focus-trap, ESC do zamknięcia

- **Modal „Sugestie AI”** (`modal:/ai-suggestions`)
  • Cel: Lista propozycji nowych celów  
  • Kluczowe informacje: Tabela sugestii, przyciski **Akceptuj / Odrzuć**  
  • Kluczowe komponenty: `AISuggestionCard`, `Modal`, `Button`, `Toast`  
  • UX / dostępność / bezpieczeństwo: Blokada podwójnego kliknięcia, optimistyczny loader w przyciskach

## 3. Mapa podróży użytkownika

1. **Anonimowy użytkownik** otwiera `/login` → wprowadza dane → **Supabase Auth** → przekierowanie na `/`.
2. Na **Dashboardzie** ładowane są równolegle: lista celów (`GET /goals`) i wykres postępu (`POST /functions/progress-annual`).  
   • Użytkownik przewija listę (paginacja „Załaduj więcej”).  
   • Kliknięcie karty celu otwiera modal „Historia celu” (`GET /goal_history`).  
   • Kliknięcie „Pokaż sugestie” wywołuje `POST /functions/ai-suggestions-generate`, po czym modal „Sugestie AI” (`GET /ai_suggestions`).  
   • Akceptacja sugestii → `POST /functions/ai-suggestions-accept` → reload `GET /goals`.
3. Użytkownik przechodzi do **Historia** (`/history`) z bottom/top-navbar.  
   • Wybiera lata i sortowanie → `POST /functions/progress-history`.
4. Użytkownik przechodzi na stronę **Moje aktywności** (`/activities`). Dane ładowane są z paginacją (`GET /api/activities`).
5. W **Ustawieniach** (`/settings`) użytkownik w zakładce **Generator danych** uruchamia symulację (`POST /functions/activities-generate`) z loaderem pełnoekranowym + toast.
6. Użytkownik może się wylogować z menu → `supabase.auth.signOut()` → redirect `/login`.

## 4. Układ i struktura nawigacji

- **Mobile**: `BottomNavBar` (ikony **Cele**, **Aktywności**, **Historia**, **Ustawienia**).  
  – Ukrywa się, gdy wciśnięta jest klawiatura lub modal na wierzchu.
- **Desktop**: `TopNavBar` (logo + linki tekstowe **Cele**, **Aktywności**, **Historia**, **Ustawienia**).
- **Router**: Astro file-based; każdy widok to plik `.astro`.  
  – Vue components używają `client:visible`/`client:idle` do hydratacji.

## 5. Kluczowe komponenty

- `AuthForm` – wspólny formularz logowania/rejestracji z walidacją z validators/
- `TopNavBar` / `BottomNavBar` – adaptacyjne paski nawigacji
- `GoalCard` – karta celu z danymi plan / wykonanie, klik → modal historyczny
- `ProgressChart` – kumulatywny wykres roku (biblioteka TBD)  
  – property: `series`, `targetValue`
- `HistoryChart` – porównanie wielu lat
- `GoalHistoryChart` – wykres zmian pojedynczego celu
- `AISuggestionCard` – panel propozycji z przyciskami akcji
- `Tabs` – zakładki w ustawieniach
- `Loader` – pełnoekranowy i inline spinner
- `ActivitiesTable` – Tabela do wyświetlania aktywności z sortowaniem
- `PaginationControl` - Komponent do nawigacji między stronami listy
- `SortDropdown` - Dropdown do wyboru kolumny sortowania
- `SportManagerPanel` – panel zarządzania sportami (lista istniejących sportów, formularz dodawania, usuwania)
- `Toast` – globalny system powiadomień (sukces / błąd)
- `SkeletonRow` – placeholder listy podczas ładowania
- `PaginationButton` – mechanizm „Załaduj więcej”
- `Modal` – dostępny modal bazowy z focus-trap i ESC

---

> Dokument stanowi podstawę implementacji widoków i komponentów w ramach MVP StravaGoals. Nierozstrzygnięte kwestie (wybór biblioteki wykresów, szczegóły tabel w modalach) zostaną doprecyzowane w dedykowanych zadaniach.
