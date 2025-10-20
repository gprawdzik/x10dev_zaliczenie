Jesteś doświadczonym menedżerem produktu, którego zadaniem jest stworzenie kompleksowego dokumentu wymagań produktu (PRD) w oparciu o poniższe opisy:

<project_description>
# Aplikacja - StravaGoals (MVP)

### Główny problem
Strava umoliwia dodawanie celów treningowych. Niestety nie ma możliwości zobaczenia historycznych wyników oraz celów treningowych. Aplikacja ta ma to umożliwiać.
### Najmniejszy zestaw funkcjonalności
- Zapisywanie, edycja, odczytywanie, przeglądanie i usuwanie celów treningowych.
- Zapis historii celów.
- Skupmy się na celach rocznych.
- Wygenerowanie zestawu aktywności zgodnych ze Strava api
- Prosty system kont użytkowników do powiązania użytkownika z celami oraz aktywnościami
- Przedstawienie graficzne celów - cel vs wykanie
- Integracja z AI umożliwiająca na podstawie aktywności z ostatnich 3 miesięcy zasugerować nowe cele lub zmienić aktualne.

### Co NIE wchodzi w zakres MVP
- Integracja ze strava api. Aktywności użytkownika zostaną wygenerowane.
- Cele inne niż roczne.
- Zaawansowana analiza aktywności.
- Zaawansowane planowanie czasu i logistyki

### Kryteria sukcesu
- 90% użytkowników posiada dodany minimum jeden cel w swoim profilu.
- 50% użytkowników akcetuje cele zaproponowane przez AI
</project_description>

<project_details>
<conversation_summary>
<decisions>

Grupa docelowa: aktywni użytkownicy Strava w Polsce; zakres roku: kalendarzowy w strefie Europe/Warsaw.
Zakres celów: możliwe jednocześnie cele globalne, konsolidujące (np. „kolarstwo”) i per-sport; brak konfliktów między nimi; postęp liczony indywidualnie dla każdego celu.
Wspierane sporty: kolarstwo, bieganie, chodzenie, piesze wędrówki, SUP, pilates, trening siłowy; mapowanie sport_type Strava jest stałe i zdefiniowane w kodzie.
Metryki celów: dystans, czas, przewyższenie (jednostki metryczne); dla pilates i treningu siłowego dozwolona tylko metryka „czas”.
Historia celów: pełna wersja zmian; każda edycja tworzy nowy wpis (append-only); brak możliwości rollbacku; brak zapisywania powodu zmiany.
Dane aktywności: brak integracji Strava w MVP; generator tworzy 100 aktywności na użytkownika wstecz za 12 miesięcy; w tygodniu aktywności głównie popołudniami, w weekend przez cały dzień; ograniczamy liczbę pól do niezbędnego minimum.
Dystrybucja sportów w generatorze: losujemy główną aktywność (50% aktywności), dwie pomocnicze (30% i 15%) oraz jedną (5%).
UX i platforma: PWA (mobile-first); strona „Moje cele” z wykresem kumulatywnym bieżącego roku; w „Historii” wykres cel vs osiąg; wykorzystanie gotowych modułów wykresów/UI.
Autoryzacja i konto: email + hasło (bez weryfikacji email); minimalne wymagania hasła 10 znaków; w koncie zmiana hasła i usunięcie konta.
AI: wchodzi w zakres MVP jako ostatni etap; sugeruje nowe cele (próg: typ aktywności >5% wszystkich wspieranych w ostatnich 3 mies.) i korekty istniejących; sugestie wyświetlane wyłącznie „na żądanie” (przycisk na „Moje cele”); cele nie mogą być nierealne.
Kryteria sukcesu: 90% użytkowników ma co najmniej jeden cel; sukces AI mierzony akceptacją sugestii; „aktywny użytkownik” = założył konto i go nie usunął; mierzymy na wszystkich zarejestrowanych aktywnych użytkownikach.
Harmonogram i zasoby: 4 tygodnie, 1 programista.
</decisions>
<matched_recommendations>

Utrwalenie stałej mapy Strava sport_type -> grupa konsolidująca -> sport bazowy w kodzie oraz wspólne użycie przez generator/obliczanie postępu/UI.
Ograniczenia metryk per sport (Pilates/Siłowy: tylko czas; pozostałe: dystans/czas/przewyższenie) z walidacją po stronie UI/BE.
Model celów ze scope_type (global/konsolidacja/sport) i scope_id, aby jednoznacznie liczyć postęp i prezentować cele oddzielnie.
Append-only historia zmian celów (nowy wpis przy edycji) bez rollbacku; identyfikator grupujący wersje jednego celu.
Minimalny zestaw pól aktywności (np. id, athlete.id, name, type, sport_type, start_date, start_date_local, timezone=Europe/Warsaw, utc_offset, distance, moving_time, elapsed_time, total_elevation_gain, average_speed) – reszta null/pominięta.
Generator z realizmem: rozkład po porach dnia (tydzień popołudnia, weekend cały dzień) i sezonowością; parametryzacja udziałów sportów.
PWA mobile-first z gotowymi modułami wykresów (np. Chart.js/Recharts) do wykresu kumulatywnego i porównania cel vs wykonanie.
Sugestie AI uruchamiane ręcznie (przycisk), z jasnym statusem „proponowane” i jednoznacznym „Akceptuj” tworzącym/aktualizującym cel.
Analityka produktowa do pomiaru KPI (np. PostHog) z eventami m.in. sign_up, goal_created/updated/deleted, activity_generated, ai_suggestion_requested/shown/accepted/dismissed.
Warstwa adaptera danych aktywności, aby w przyszłości łatwo podmienić generator na integrację ze Strava API. </matched_recommendations>
<prd_planning_summary>
Główne wymagania funkcjonalne:

Konta i autoryzacja: rejestracja/logowanie email+hasło (min. 10 znaków), zmiana hasła, usunięcie konta.
Cele roczne: tworzenie/edycja/odczyt/przegląd/usuwanie; obsługa 3 metryk (dystans, czas, przewyższenie), ograniczenia per sport; scope: global/konsolidacja/per-sport; rok = kalendarzowy (Europe/Warsaw); walidacja jednostek metrycznych.
Historia celów: pełna wersjonowalność przez wpisy append-only (każda edycja = nowa wersja), widok historii zmian i wykres cel vs wykonanie.
Aktywności: generator danych (100 aktywności/12 mies. wstecz) z realistycznym rozkładem w czasie; rozdział po sportach: 50% główny, 20% i 15% pomocnicze, 5% kolejny; minimalny zestaw pól zgodny z uproszczonym modelem Strava; mapowanie sportów stałe w kodzie.
Wizualizacje: „Moje cele” – wykres kumulatywny (cel vs wykonanie w bieżącym roku) oraz lista kart celów; „Historia” – wykres cel vs osiąg oraz lista zmian; gotowe komponenty wykresów/UI.
AI (ostatni etap): analiza ostatnich 3 miesięcy wspieranych aktywności; reguła progu >5% do proponowania nowych celów; możliwość korekty istniejących; prezentacja wyłącznie na żądanie; akceptacja tworzy/aktualizuje cel; cele nie mogą być nierealne.
PWA: mobile-first, responsywna, szybkie czasy ładowania.
Kluczowe historie użytkownika i ścieżki:

Rejestracja/logowanie: U jako nowy -> zakłada konto -> loguje się -> przechodzi do „Moje cele”.
Tworzenie celu: U -> „Dodaj cel” -> wybiera scope (global/konsolidacja/sport), sport/konso, metrykę, wartość -> zapis -> cel widoczny na liście i na wykresie kumulatywnym.
Edycja celu: U -> edytuje cel -> zapis -> powstaje nowy wpis w historii -> wykres aktualizuje postęp względem nowej wartości.
Przegląd postępu: U -> „Moje cele” -> przegląda karty celów i wykresy (kumulatywny); „Historia” -> widzi zmiany i wykres porównawczy.
Sugestie AI: U -> klik „Pokaż sugestie” -> widzi listę propozycji (nowe/korekty) -> „Akceptuj” tworzy/aktualizuje cel lub „Odrzuć”.
Zarządzanie kontem: U -> zmiana hasła -> wyloguj; U -> usuń konto -> dane usunięte zgodnie z polityką MVP.
Kryteria sukcesu i pomiar:

90% użytkowników posiada ≥1 cel: licznik na wszystkich „aktywnych” (konto istnieje, nieusunięte). Zalecane okno D0–D+7 od rejestracji dla porównywalności kohort (do potwierdzenia).
Skuteczność AI: odsetek zaakceptowanych sugestii wśród wyświetlonych; definicja sukcesu = klik „Akceptuj”.
Telemetria: wdrożyć eventy (sign_up, goal_created, goal_updated, goal_deleted, activity_generated, ai_suggestion_requested/shown/accepted/dismissed) i dashboardy konwersji.
Plan wysokopoziomowy (4 tyg., 1 dev; AI na końcu):

T1: Model danych (users, goals, goal_versions, activities, mappings), auth, podstawowe CRUD celów, generator aktywności (backfill 12 mies.), minimalny wykres kumulatywny.
T2: Historia celów (append-only), widok „Historia” z wykresem cel vs osiąg, walidacje metryk i scope, dopracowanie generatora (rozkład czasu, udziały sportów).
T3: UX mobile-first PWA, optymalizacje wykresów i list, analityka eventowa, testy E2E krytycznych ścieżek.
T4: Moduł AI (na żądanie): logika progu 5%, generowanie propozycji i korekt, UI sugestii z akceptacją/odrzuceniem; stabilizacja i QA.
Ryzyka i mitigacje:

Jednoosobowy zespół i termin 4 tyg.: ograniczyć zakres UI (proste widoki, gotowe biblioteki) i pola aktywności; AI dostarczyć w minimalnym wariancie regułowym.
Jasno komunikować MVP i brak realnych danych Strava.
Wiarygodność danych generowanych: parametryzacja sezonowości i pór dnia; jasny komunikat „dane symulowane”.
</prd_planning_summary>

<unresolved_issues>

AI: konkretna formuła „nieralności” i korekt (np. projekcja roczna 0.8–1.0 x ostatnie 12 tyg.) oraz zachowanie, gdy propozycja duplikuje istniejący cel (aktualizacja vs nowy cel).
Okno pomiarowe KPI (np. D0–D+7 dla „≥1 cel”, D0–D+30 dla skuteczności AI) i wybór narzędzia analitycznego.
Model danych celów: wymagany identyfikator grupujący wersje jednego celu (goal_group_id) i zasady agregacji postępu w czasie przy zmianach wartości celu.
Szczegóły mapowania konsolidacji (finalna lista sport_type -> grupa -> sport) i czy „VirtualRide/VirtualRun” wchodzą do konsolidacji.
Usuwanie konta: twarde vs miękkie usunięcie, czas retencji danych (np. natychmiast vs opóźnienie), zakres kasowanych danych (celów, aktywności, logów).
Prezentacja wielu celów tej samej metryki w UI (global/konsolidacja/per-sport): kolejność, filtrowanie, czy są limity liczby celów na użytkownika.
Zakres minimalnych pól aktywności: finalna lista i wartości domyślne/null (np. average_speed) oraz dokładne reguły wyliczeń start_date_local i utc_offset z DST.
Onboarding: czy proponujemy szybki kreator pierwszego celu po rejestracji, aby osiągnąć KPI 90%.
Minimalne środki bezpieczeństwa poza hasłem (rate limiting, lockout po X próbach, przechowywanie haseł z silnym hashowaniem) – czy dopuszczalne w MVP. </unresolved_issues> </conversation_summary>
</project_details>

Wykonaj następujące kroki, aby stworzyć kompleksowy i dobrze zorganizowany dokument:

1. Podziel PRD na następujące sekcje:
   a. Przegląd projektu
   b. Problem użytkownika
   c. Wymagania funkcjonalne
   d. Granice projektu
   e. Historie użytkownika
   f. Metryki sukcesu

2. W każdej sekcji należy podać szczegółowe i istotne informacje w oparciu o opis projektu i odpowiedzi na pytania wyjaśniające. Upewnij się, że:
   - Używasz jasnego i zwięzłego języka
   - W razie potrzeby podajesz konkretne szczegóły i dane
   - Zachowujesz spójność w całym dokumencie
   - Odnosisz się do wszystkich punktów wymienionych w każdej sekcji

3. Podczas tworzenia historyjek użytkownika i kryteriów akceptacji
   - Wymień WSZYSTKIE niezbędne historyjki użytkownika, w tym scenariusze podstawowe, alternatywne i skrajne.
   - Przypisz unikalny identyfikator wymagań (np. US-001) do każdej historyjki użytkownika w celu bezpośredniej identyfikowalności.
   - Uwzględnij co najmniej jedną historię użytkownika specjalnie dla bezpiecznego dostępu lub uwierzytelniania, jeśli aplikacja wymaga identyfikacji użytkownika lub ograniczeń dostępu.
   - Upewnij się, że żadna potencjalna interakcja użytkownika nie została pominięta.
   - Upewnij się, że każda historia użytkownika jest testowalna.

Użyj następującej struktury dla każdej historii użytkownika:
- ID
- Tytuł
- Opis
- Kryteria akceptacji

4. Po ukończeniu PRD przejrzyj go pod kątem tej listy kontrolnej:
   - Czy każdą historię użytkownika można przetestować?
   - Czy kryteria akceptacji są jasne i konkretne?
   - Czy mamy wystarczająco dużo historyjek użytkownika, aby zbudować w pełni funkcjonalną aplikację?
   - Czy uwzględniliśmy wymagania dotyczące uwierzytelniania i autoryzacji (jeśli dotyczy)?

5. Formatowanie PRD:
   - Zachowaj spójne formatowanie i numerację.
   - Nie używaj pogrubionego formatowania w markdown ( ** ).
   - Wymień WSZYSTKIE historyjki użytkownika.
   - Sformatuj PRD w poprawnym markdown.

Przygotuj PRD z następującą strukturą:

```markdown
# Dokument wymagań produktu (PRD) - StravaGoals
## 1. Przegląd produktu
## 2. Problem użytkownika
## 3. Wymagania funkcjonalne
## 4. Granice produktu
## 5. Historyjki użytkowników
## 6. Metryki sukcesu
```

Pamiętaj, aby wypełnić każdą sekcję szczegółowymi, istotnymi informacjami w oparciu o opis projektu i nasze pytania wyjaśniające. Upewnij się, że PRD jest wyczerpujący, jasny i zawiera wszystkie istotne informacje potrzebne do dalszej pracy nad produktem.

Ostateczny wynik powinien składać się wyłącznie z PRD zgodnego ze wskazanym formatem w markdown, który zapiszesz w pliku .ai/prd.md