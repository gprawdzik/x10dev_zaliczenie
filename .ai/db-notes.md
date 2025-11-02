<conversation_summary>
<decisions>

1. Utworzyć oddzielną tabelę `sports` z kolumnami `id UUID`, `code`, `name`, `description` oraz polem `consolidated JSONB` do grupowania powiązanych sportów.
2. W tabeli `goals` użyć dwóch trybów: `global` oraz `per_sport` (przechowywane przez `sport_id`), bez dodatkowego `consolidation` scope.
3. Pole `elapsed_time` i `moving_time` w tabeli `activities` będą typu `INTERVAL`.
4. W każdej tabeli klucz główny będzie typu `UUID` z `DEFAULT gen_random_uuid()`.
5. Na wszystkich kluczach obcych `user_id` dodać `ON DELETE CASCADE`.
6. Dodanie tabeli `goal_history` dla append-only historii zmian celów.
7. Tabela `ai_suggestions` zawierać będzie:
   - `user_id UUID`
   - `suggestion_data JSONB`
   - `created_at TIMESTAMP`
   - `status ENUM('pending','accepted','rejected')`
   - `response_time_ms INT CHECK(response_time_ms >= 0)`
   - `error_message TEXT`
8. Nie wprowadzamy wersjonowania przez kolumnę `version`; historię zmian obsługuje `goal_history`.
9. Zrezygnować z przechowywania pełnego surowego payloadu aktywności (`raw_payload JSONB`).
10. Dodane indeksy B-tree:
    - `(user_id, start_date)` w `activities`
    - `(user_id, year)` w `goals`
    - `(user_id, status)` i `created_at` w `ai_suggestions`
11. Włączyć RLS na wszystkich tabelach z politykami `SELECT/INSERT/UPDATE/DELETE`, które pozwalają operacje tylko gdy `user_id = auth.uid()`.
12. Dodać CHECK constraints `>= 0` na kolumnach metryk (dystans, czas, przewyższenie, `target_value`).  
    </decisions>

<matched_recommendations>

1. Utworzyć tabelę `sports` z własnym PK i unikalnymi kodami sportów.
2. Użyć typu `INTERVAL` dla czasu aktywności.
3. Zastosować `UUID` z `gen_random_uuid()` jako klucze główne.
4. Dodać `ON DELETE CASCADE` na FK `user_id`.
5. Włączyć RLS z politykami opartymi na `user_id`.
6. Rozszerzyć `ai_suggestions` o `response_time_ms` i `error_message`.
7. Zrezygnować z partycjonowania i surowych payloadów dla MVP.
8. Dodać odpowiednie CHECK constraints dla wartości metryk.  
   </matched_recommendations>

<database_planning_summary>
W MVP zaplanowano następujące główne encje:

- users (zarządzanie kontami, RLS)
- sports (lista sportów + pole `consolidated JSONB` do grup)
- goals (cele roczne, `metric_type`, `target_value`, FK do `sports`, unikalny zakres)
- goal_history (append-only historia zmian zawierająca timestamp i starą wartość)
- activities (symulowane aktywności ze Strava, pola czasowe jako `INTERVAL`)
- ai_suggestions (sugestie AI z metadanymi, JSONB, status, czas generowania, błędy)

Relacje:

- user → goals, activities, ai_suggestions, goal_history (FK `user_id` z ON DELETE CASCADE)
- goals → sports (`sport_id` dla per_sport)
- goal_history → goals

Bezpieczeństwo i skalowalność:

- RLS na wszystkich tabelach, każdy użytkownik operuje wyłącznie na własnych rekordach.
- Indeksy B-tree na kluczach filtrowania i sortowania (`user_id`, `start_date`, `year`, `status`, `created_at`).
- CHECK constraints gwarantujące nieujemne wartości metryk.
- Brak partycjonowania i surowych JSONB payloadów w MVP, co upraszcza rozwój.

</database_planning_summary>

<unresolved_issues>
Brak istotnych nierozwiązanych kwestii — wszystkie główne aspekty modelu danych i reguły zostały ustalone.  
</unresolved_issues>
</conversation_summary>
