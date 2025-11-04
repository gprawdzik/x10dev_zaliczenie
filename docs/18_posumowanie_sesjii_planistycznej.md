<conversation_summary>

<decisions>
1. Strona startowa po zalogowaniu wyświetla prosty widok „Cel vs Wykonanie” (lista celów z bieżącym postępem).  
2. Lista celów pokazuje plan vs realizację; kliknięcie na kartę rozwija modal z wykresem kumulatywnym.  
3. Generator aktywności będzie dostępny w osobnej zakładce „Generator danych” w ustawieniach użytkownika (nie ukrywamy w dev-menu).  
4. Sugestie AI prezentujemy w modalu nad listą celów; przyciski „Akceptuj/Odrzuć” aktualizują dane bez przeładowania strony.  
5. Historia zmian celu (goal_history) wyświetlana w modalu w formie wykresu.  
6. Komunikaty sukcesu/błędów realizujemy przez komponent toast.  
7. Responsywność budujemy utility-wariantami Tailwind; układ kart 1 × N (mobile) i 2-3 kolumny (desktop).  
8. Autoryzację w UI obsługuje centralny hook `useUserSession`; brak sesji przekierowuje do /login.  
9. Listy (np. sporty, aktywności) paginujemy przyciskiem „Załaduj więcej” (brak infinite-scroll).  
10. Maksymalne wykorzystanie biblioteki shadcn/vue dla formularzy i wspólnych komponentów UI.  
11. Struktura sklepu Pinia: `goalsStore`, `aiStore`, `historyStore` + `useUserSession` (zaakceptowano).  
12. Dla UI stosujemy gotowe komponenty shadcn/vue; osobna decyzja dot. biblioteki wykresów pozostaje otwarta.  
13. Po akceptacji sugestii AI wykonujemy ponowny GET `/goals` zamiast lokalnej mutacji store (możliwy wybór wielu sugestii).  
14. Brak wsparcia offline/cache w MVP.  
15. Nawigacja mobilna: dolny navbar (3 ikony); desktop: klasyczne menu górne.  
16. Skeletony w listach/tabelach o stałej wysokości; liczba skeletonów = `limit`.  
17. Motyw ciemny: Tailwind `[data-theme='dark']` + `useDarkMode()` w Pinia.  
18. Generator aktywności może otworzyć osobny widok z loaderem do zakończenia operacji.  
19. Błędy walidacji formularzy wyświetlamy w toast; mapowanie pól opcjonalne.  
20. Brak optymalizacji liczby requestów do API w widoku historii – prostota ważniejsza od wydajności w MVP.
</decisions>

<matched_recommendations>

1. Widok „Moje cele” łączący wykres i listę celów – przyjęty.
2. Modal dla sugestii AI z natychmiastową aktualizacją listy – przyjęty.
3. Komponent toast + skeleton dla stanów ładowania i błędów – przyjęty.
4. Dolny navbar na mobile, menu górne na desktop – przyjęty.
5. Dark-mode przy użyciu Tailwind + Pinia – przyjęty.
6. Struktura Pinia (goals/ai/history stores) i centralny hook sesji – przyjęta.
7. Paginacja przyciskiem „Załaduj więcej” – przyjęta.
8. shadcn/vue jako główna biblioteka UI – przyjęta.
9. SkeletonRow o stałej wysokości w listach – przyjęty.
10. Loader + toast w widoku generatora aktywności – przyjęty.
    </matched_recommendations>

<ui_architecture_planning_summary>
A. Główne wymagania UI  
• Zaprezentować użytkownikowi po zalogowaniu listę celów z bieżącym postępem (plan vs realizacja).  
• Udostępnić szybkie akcje: przegląd historii celu, wyświetlenie sugestii AI, generator aktywności.  
• Zachować prostotę i spójność styli (shadcn/vue + Tailwind).

B. Kluczowe widoki i przepływy

1. Dashboard „Moje cele”  
   – Sekcja wykresu kumulatywnego (ukryta do kliknięcia).  
   – Lista kart celów (plan, wykonanie, %).
2. Modal „Historia celu” (wykres + tabele zmian).
3. Modal „Sugestie AI”  
   – Lista propozycji z przyciskami Akceptuj/Odrzuć; po akceptacji: request `/functions/ai-suggestions-accept`, potem GET `/goals`.
4. Widok „Historia” (progress-history) z wyborem lat i paginacją.
5. Widok „Ustawienia”  
   – Zakładki: Profil, Generator danych (przycisk → loader & toast).
6. Nawigacja  
   – Mobile: bottom-navbar (Cele, Historia, Ustawienia).  
   – Desktop: top-navbar.

C. Integracja z API i zarządzanie stanem  
• Supabase client inicjowany w Vue pluginie; token i sesja przechowywane w `useUserSession`.  
• `goalsStore` (CRUD `/goals`, progress-annual), `aiStore` (CRUD `/ai_suggestions` + functions), `historyStore` (progress-history).  
• Po działaniach mutujących odświeżamy dane wywołując odpowiednie GET/POST; brak skomplikowanego cache.  
• Toasty do obsługi błędów (model error → user-friendly message).

D. Responsywność, dostępność, bezpieczeństwo  
• Tailwind breakpoints + utility-variants zapewniają układ 1 × N (mobile) i ≥2 kolumn (desktop).  
• Dark-mode na przełączniku lub preferencjach systemowych.  
• Komponenty shadcn/vue wspierają focus-states i ARIA; dodatkowa weryfikacja kontrastu w dark-mode.  
• Wszystkie requesty zawierają `Authorization: Bearer` z Supabase; refresh tokenów obsługiwany przez klienta.  
• Brak offline-mode; sesja wymagana do każdej interakcji.

E. Nierozwiązane kwestie lub dalsze kroki  
• Wybór konkretnej biblioteki wykresów (echarts, chart.js, visx) – do potwierdzenia.  
• Definicja dokładnej struktury modalu historii celu (kolumny tabeli vs tylko wykres).  
• Mapowanie błędów walidacyjnych pól formularzy (toast vs inline) – potrzeba makiety.  
• Style/dokładny UX dla generatora aktywności – spinner czy pełnoekranowy loader.
</ui_architecture_planning_summary>

<unresolved_issues>

1. Wybór biblioteki chartów i sposób jej integracji ze shadcn/vue.
2. Szczegóły UI modalu „Historia celu” – zakres danych tabelarycznych.
3. Strategie prezentacji błędów formularzy (inline vs toast) – makiety potrzebne.
4. Dokładny UX loadera w generatorze aktywności.  
   </unresolved_issues>

</conversation_summary>
