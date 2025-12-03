Oto propozycja promptu dla generatora PoC, opartego wyłącznie na kluczowych wymaganiach MVP i wybranym stacku. Proszę użyć tego tekstu jako wejścia do narzędzia AI:

---
**Prompt do generatora PoC „StravaGoals”**

Cel: szybko zweryfikować podstawową funkcjonalność aplikacji StravaGoals, bez nadmiarowych rozwiązań.

1. **Zakres funkcji (tylko MVP)**  
   a) Konta i autoryzacja  
      - Rejestracja (email + hasło ≥10 znaków)  
      - Logowanie / wylogowanie  
      - Zmiana hasła  
      - Usunięcie konta  
   b) Generator aktywności (symulacja)  
      - 100 aktywności za ostatnie 12 miesięcy  
      - Pola: id, athlete.id, name, type, sport_type, start_date(s), timezone, distance, moving_time, elapsed_time, total_elevation_gain, average_speed  
      - Rozkład: większość aktywności w popołudnia dni robocze, cały dzień w weekendy; sporty: 50% główna, 30% druga, 15% trzecia, 5% czwarta  
   c) Zarządzanie celami rocznymi (CRUD)  
      - Definicja zakresu (globalny, per sport) + metryka (dystans, czas, przewyższenie) + rok + wartość  
      - Każda edycja tworzy nową wersję (append-only)  
   d) Wizualizacje  
      - Strona „Moje cele”: wykres kumulatywny postępu i lista kart celów  
      - Strona „Historia”: wykres porównujący cel vs wykonanie  
2. **Wykluczone funkcje**  
   - Sugestie AI (US-010…US-012)  
   - Zaawansowane analizy ani integracja z prawdziwym API Stravy  
   - Moduły dodatkowe spoza MVP  
3. **Stack technologiczny**  
   - Frontend: Vue 3 + TypeScript + Tailwind 4  
   - Backend: Supabase (Auth, PostgreSQL, real-time, Storage)  
   - CI/CD: GitHub Actions  
   - Hosting PoC: Cloudflare Pages w Dockerze  
4. **Plan pracy i harmonogram**  
   1) **Projekt architektury** (endpoints, modele danych, układ komponentów)  
   2) **Implementacja backendu**  
      - Konfiguracja Supabase, schemat bazy, funkcje auth, generacja danych  
   3) **Implementacja frontendu**  
      - Formularze auth, CRUD celów, generator aktywności, wykresy  
   4) **Testy manualne + wstępne automatyczne**  
   5) **Prezentacja PoC i zbiórka uwag**  

**Uwaga:** przed przystąpieniem do realizacji każdej z powyższych faz generator powinien przedstawić szczegółowy plan i uzyskać moją akceptację, a dopiero potem kontynuować tworzenie PoC.