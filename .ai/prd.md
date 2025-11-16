# Dokument wymagań produktu (PRD) - StravaGoals

## 1. Przegląd produktu

Aplikacja StravaGoals umożliwia użytkownikom definiowanie, śledzenie oraz wizualizację rocznych celów treningowych opartych na wygenerowanych danych aktywności. Użytkownik może tworzyć, edytować i usuwać cele, przeglądać historię zmian oraz generować sugestie nowych lub zmodyfikowanych celów przy użyciu prostego modułu AI.

## 2. Problem użytkownika

Użytkownicy Strava nie mają możliwości:

- przeglądania i przechowywania historycznych celów treningowych
- wizualizacji postępu względem założonych celów
- otrzymywania inteligentnych sugestii dotyczących nowych lub modyfikowanych celów na podstawie wcześniejszych aktywności

Brak tych funkcji utrudnia analizę dotychczasowych osiągnięć i planowanie przyszłych celów.

## 3. Wymagania funkcjonalne

- Konta i autoryzacja
  - rejestracja za pomocą email i hasła
  - logowanie i wylogowanie
  - zmiana hasła
  - usunięcie konta
- Zarządzanie celami rocznymi
  - tworzenie, edycja, odczyt, przegląd i usunięcie celów
  - trzy metryki: dystans, czas, przewyższenie (Pilates i trening siłowy: tylko czas)
  - zakres: globalny, konsolidacja, per-sport
  - walidacja jednostek metrycznych i ograniczeń metryk per sport
- Historia celów
  - każda edycja tworzy nowy wpis append-only
  - brak rollbacku, brak zapisu powodu zmiany
  - widok listy wersji i wykres cel vs wykonanie
- Generator aktywności
  - symulacja 100 aktywności przypadających na ostatnie 12 miesięcy
  - rozkład pór dnia (tydzień popołudnia, weekend cały dzień)
  - dystrybucja sportów: 50% główny, 30% druga, 15% trzecia, 5% czwarta
  - minimalny zestaw pól zgodny ze Strava (id, athlete.id, name, type, sport_type, start_date, start_date_local, timezone, utc_offset, distance, moving_time, elapsed_time, total_elevation_gain, average_speed)
- Moje aktywności
  - Wyświetlanie aktywności
  - paginacja
  - możliwość sortowania
- Wizualizacje
  - strona "Moje cele": wykres kumulatywny postępu w bieżącym roku i lista kart celów
  - strona "Historia": wykres porównawczy cel vs wykonanie dla wszystkich lat obowiązywania celu.
- Sugestie AI (na żądanie)
  - analiza ostatnich 3 miesięcy aktywności
  - próg 5% udziału sportu do propozycji nowych lub korekt
  - przycisk "Pokaż sugestie" uruchamia proces
  - wyświetlanie listy sugestii i przycisków "Akceptuj" lub "Odrzuć"
  - akceptacja tworzy lub aktualizuje cel

## 4. Granice produktu

- brak integracji z rzeczywistym API Strava (dane aktywności generowane)
- obsługa wyłącznie celów rocznych
- brak zaawansowanej analizy aktywności i planowania logistycznego
- ograniczone bezpieczeństwo poza minimalnym hashowaniem haseł

## 5. Historyjki użytkowników

- ID: US-001
  Tytuł: Rejestracja nowego użytkownika
  Opis: Użytkownik zakłada konto podając email i hasło.
  Kryteria akceptacji:
  - formularz rejestracyjny akceptuje email i hasło (min 10 znaków)
  - po poprawnej rejestracji użytkownik zostaje zalogowany

- ID: US-002
  Tytuł: Logowanie istniejącego użytkownika
  Opis: Użytkownik loguje się za pomocą email i hasła.
  Kryteria akceptacji:
  - formularz logowania akceptuje poprawne dane
  - przy błędnych danych wyświetla komunikat o błędzie

- ID: US-003
  Tytuł: Zmiana hasła
  Opis: Zalogowany użytkownik zmienia swoje hasło.
  Kryteria akceptacji:
  - wymagana autoryzacja obecnym hasłem
  - nowe hasło spełnia wymagania długości
  - po zmianie użytkownik może się zalogować przy użyciu nowego hasła

- ID: US-004
  Tytuł: Usunięcie konta
  Opis: Zalogowany użytkownik usuwa swoje konto.
  Kryteria akceptacji:
  - potwierdzenie decyzji (modal)
  - usunięcie wszystkich danych użytkownika
  - przekierowanie na stronę rejestracji/logowania

- ID: US-005
  Tytuł: Generator aktywności
  Opis: System generuje symulowane dane aktywności dla użytkownika na podstawie parametrów realistycznego rozkładu.
  Kryteria akceptacji:
  - generowane jest 100 aktywności obejmujących ostatnie 12 miesięcy
  - aktywności mają minimalny zestaw pól zgodny ze uproszonym modelem Strava (id, athlete.id, name, type, sport_type, start_date, start_date_local, timezone, utc_offset, distance, moving_time, elapsed_time, total_elevation_gain, average_speed)
  - wygenerowane aktywności są uwzględniane w wizualizacjach postępu i historii
  - rozkład pór dnia: większość aktywności w popołudniowych godzinach w dni powszednie i przez cały dzień w weekendy
  - rozkład sportów: 50% główna aktywność, 30% druga pomocnicza, 15% trzecia pomocnicza, 5% czwarta

- ID: US-006
  Tytuł: Dodanie nowego celu rocznego
  Opis: Użytkownik definiuje nowy cel wybierając zakres, metrykę i wartość.
  Kryteria akceptacji:
  - formularz zawiera pola: scope_type, scope_id, metryka, wartość, rok
  - po zapisie cel pojawia się na liście i wykresie

- ID: US-007
  Tytuł: Edycja istniejącego celu
  Opis: Użytkownik edytuje wartość celu rocznego.
  Kryteria akceptacji:
  - każda edycja tworzy nową wersję celu
  - wykres kumulatywny odzwierciedla nową wartość po zapisie

- ID: US-008
  Tytuł: Usunięcie celu
  Opis: Użytkownik usuwa swój cel.
  Kryteria akceptacji:
  - cel zostaje usunięty z listy i wykresu

- ID: US-009
  Tytuł: Przegląd postępu w "Moje cele"
  Opis: Użytkownik przegląda listę swoich celów i wykres kumulatywny.
  Kryteria akceptacji:
  - wykres kumulatywny aktualizuje się zgodnie z aktualnymi danymi
  - lista celów wyświetla kluczowe informacje (metoda\*, postęp%, custom)
  - wykres porównawczy cel vs wykonanie

- ID: US-010
  Tytuł: Wyświetlenie sugestii AI
  Opis: Użytkownik klika "Pokaż sugestie" na stronie "Moje cele".
  Kryteria akceptacji:
  - wyświetla się lista propozycji nowych celów

- ID: US-011
  Tytuł: Akceptacja sugestii AI
  Opis: Użytkownik akceptuje wybraną sugestię.
  Kryteria akceptacji:
  - wybrana sugestia tworzy lub aktualizuje cel
  - powiadomienie o sukcesie operacji

- ID: US-012
  Tytuł: Odrzucenie sugestii AI
  Opis: Użytkownik rezygnuje z danej sugestii.
  Kryteria akceptacji:
  - sugestia zostaje oznaczona jako odrzucona i nie pojawia się ponownie

- ID: US-013
  Tytuł: Dodanie sportu przez administratora
  Opis: Użytkownik z tolą administrator ma możliwość dodania nowego sportu w zakladce Ustawienia.
  Kryteria akceptacji:
  - Administrator ma możliwość dodania nowego rodzaju sportu.

- ID: US-014
  Tytuł: Wyświetlanie aktywności
  Opis: Użytkownik może wyświetlić wygenerowane aktywności.
  Kryteria akceptacji:
    - Użytkownik widzi swoje aktywności. 
    - paginacja
    - sortowanie

## 6. Metryki sukcesu

- 90% aktywnych użytkowników posiada przynajmniej jeden cel w ciągu 7 dni od rejestracji
- 50% użytkowników akceptuje sugestie proponowane przez moduł AI
