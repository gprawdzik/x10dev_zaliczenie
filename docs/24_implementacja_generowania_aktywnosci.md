# Implementacja Generowania Aktywności

## Opis zmian (2025-11-15)

System generowania aktywności został zrefaktoryzowany w celu usunięcia zaprogramowanych profili sportów i wykorzystania dynamicznych danych z bazy danych.

## Zmiany w architekturze

### 1. Usunięte elementy

- **Stałe `SPORT_PROFILES`** w `src/services/activities.ts` - zawierające zakodowane profile sportów
- **Stała `FALLBACK_PROFILE`** - domyślny profil sportowy
- **Stała `DEFAULT_SPORTS`** - lista domyślnych kodów sportów
- **Stała `FALLBACK_SPORTS`** w `ActivityGeneratorPanel.vue` - zapasowa lista sportów w komponencie

### 2. Zmodyfikowane elementy

#### `src/services/activities.ts`

- **Funkcja `generateActivities()`** - dodany nowy parametr `sports: SportDto[]`
- **Typ `GeneratorConfig`** - zmieniony z `sports: string[]` na `profiles: SportProfile[]`
- **Typ `SportProfile`** - dodane pole `code: string`
- **Funkcja `resolveGeneratorConfig()`** - przyjmuje `sports: SportDto[]` i buduje profile z pola `consolidated`
- **Nowe funkcje pomocnicze:**
  - `buildSportProfile()` - konwertuje `SportDto` na `SportProfile`
  - `extractRange()` - wyciąga zakresy z pola `consolidated`
  - `ensureFourProfiles()` - zapewnia dokładnie 4 profile dla dystrybucji
- **Funkcja `pickSportProfile()`** (poprzednio `pickSportType()`) - teraz zwraca cały profil zamiast kodu
- **Funkcja `createSyntheticActivity()`** - używa `profile.code` zamiast `sportType`

#### `src/pages/api/activities-generate.ts`

- Dodany import `getSports` i `GetSportsError`
- Handler `POST` pobiera sporty z bazy danych przez `getSports()`
- Filtrowanie sportów na podstawie `primary_sports` z requestu
- Walidacja czy wybrane sporty istnieją w bazie
- Przekazanie `selectedSports` do funkcji `generateActivities()`

#### `src/components/views/ActivityGeneratorPanel.vue`

- Usunięta stała `FALLBACK_SPORTS`
- Funkcja `selectSportsCodes()` zwraca pustą tablicę zamiast fallbacku
- Funkcja `rerollSports()` wyświetla toast z ostrzeżeniem gdy brak sportów
- Zaktualizowane komunikaty błędów informujące o konieczności dodania sportów w systemie

### 3. Nowe elementy

#### `supabase/migrations/20251115180000_add_default_sports_with_profiles.sql`

Migracja dodająca domyślne sporty z profilami aktywności:

- running, cycling, swimming, hiking
- walking, sup, pilates, strength_training

Każdy sport zawiera w polu `consolidated` strukturę JSON:

```json
{
  "type": "Strava activity type",
  "distanceKmRange": [min_km, max_km],
  "speedKphRange": [min_kph, max_kph],
  "elevationRange": [min_meters, max_meters]
}
```

## Struktura danych

### Pole `consolidated` w tabeli `sports`

Format JSONB przechowujący profil aktywności:

```typescript
{
  type: string // Typ aktywności Strava (Run, Ride, Swim, Hike, Walk, Workout, etc.)
  distanceKmRange: [number, number] // Zakres dystansu w km [min, max]
  speedKphRange: [number, number] // Zakres prędkości w km/h [min, max]
  elevationRange: [number, number] // Zakres przewyższenia w metrach [min, max]
}
```

### Domyślne wartości

Jeśli pole `consolidated` nie zawiera wymaganych danych, używane są domyślne wartości:

- `distanceKmRange`: [3, 10]
- `speedKphRange`: [4, 8]
- `elevationRange`: [0, 200]
- `type`: "Workout"

## Przepływ danych

1. **Frontend (ActivityGeneratorPanel.vue)**
   - Pobiera listę sportów z `/api/sports`
   - Użytkownik wybiera sporty (lub są losowane)
   - Wysyła `primary_sports` do `/api/activities-generate`

2. **Backend Endpoint (`/api/activities-generate`)**
   - Pobiera wszystkie sporty z bazy przez `getSports()`
   - Filtruje sporty według `primary_sports` z requestu
   - Wywołuje `generateActivities(userId, selectedSports, overrides)`

3. **Service (`activities.ts`)**
   - Buduje profile sportów z pola `consolidated` każdego `SportDto`
   - Zapewnia 4 profile dla dystrybucji (primary/secondary/tertiary/quaternary)
   - Generuje 100 aktywności używając profili sportowych
   - Zapisuje aktywności do bazy danych

## Obsługa błędów

- Jeśli `primary_sports` zawiera kody nieistniejące w bazie → błąd 422
- Jeśli brak sportów w bazie → błąd 422
- Jeśli błąd podczas pobierania sportów → błąd 500
- Frontend wyświetla odpowiednie komunikaty toast

## Testowanie

Aby przetestować nowy system:

1. Uruchom migrację dodającą domyślne sporty:

   ```bash
   # Jeśli używasz lokalnego Supabase
   supabase db reset
   ```

2. Dodaj własny sport przez `/api/sports`:

   ```bash
   curl -X POST http://localhost:4321/api/sports \
     -H "Content-Type: application/json" \
     -d '{
       "code": "yoga",
       "name": "Yoga",
       "description": "Yoga and stretching",
       "consolidated": {
         "type": "Workout",
         "distanceKmRange": [1, 3],
         "speedKphRange": [2, 4],
         "elevationRange": [0, 10]
       }
     }'
   ```

3. Generuj aktywności z wybranymi sportami:
   ```bash
   curl -X POST http://localhost:4321/api/activities-generate \
     -H "Content-Type: application/json" \
     -d '{
       "primary_sports": ["running", "cycling", "yoga"],
       "timezone": "Europe/Warsaw"
     }'
   ```

## Migracja istniejących danych

Jeśli masz już sporty w bazie bez pola `consolidated`, możesz je zaktualizować:

```sql
UPDATE sports
SET consolidated = '{
  "type": "Workout",
  "distanceKmRange": [3, 10],
  "speedKphRange": [4, 8],
  "elevationRange": [0, 200]
}'::jsonb
WHERE consolidated IS NULL;
```

---

## Poprzednia treść dokumentu

Twoim zadaniem jest zaimplementowanie widoku frontendu w oparciu o podany plan implementacji i zasady implementacji. Twoim celem jest stworzenie szczegółowej i dokładnej implementacji, która jest zgodna z dostarczonym planem, poprawnie reprezentuje strukturę komponentów, integruje się z API i obsługuje wszystkie określone interakcje użytkownika.

Interesuje mnie tylko zaimplementowanie funkcjonalności generowania aktywności. Nic więcej.

Najpierw przejrzyj plan implementacji:

<implementation_plan>
@view-settings-implementation-plan.md
</implementation_plan>

Teraz przejrzyj zasady implementacji:

<implementation_rules>
@shared.mdc, @frontend.mdc
</implementation_rules>

Przejrzyj zdefiniowane typy:

<types>
@types.ts
</types>

Wdrażaj plan zgodnie z następującym podejściem:

<implementation_approach>
Realizuj maksymalnie 3 kroki planu implementacji, podsumuj krótko co zrobiłeś i opisz plan na 3 kolejne działania - zatrzymaj w tym momencie pracę i czekaj na mój feedback.
</implementation_approach>

Dokładnie przeanalizuj plan wdrożenia i zasady. Zwróć szczególną uwagę na strukturę komponentów, wymagania dotyczące integracji API i interakcje użytkownika opisane w planie.

Wykonaj następujące kroki, aby zaimplementować widok frontendu:

1. Struktura komponentów:
   - Zidentyfikuj wszystkie komponenty wymienione w planie wdrożenia.
   - Utwórz hierarchiczną strukturę tych komponentów.
   - Upewnij się, że obowiązki i relacje każdego komponentu są jasno zdefiniowane.

2. Integracja API:
   - Zidentyfikuj wszystkie endpointy API wymienione w planie.
   - Wdróż niezbędne wywołania API dla każdego endpointa.
   - Obsłuż odpowiedzi z API i odpowiednio aktualizacji stan komponentów.

3. Interakcje użytkownika:
   - Wylistuj wszystkie interakcje użytkownika określone w planie wdrożenia.
   - Wdróż obsługi zdarzeń dla każdej interakcji.
   - Upewnij się, że każda interakcja wyzwala odpowiednią akcję lub zmianę stanu.

4. Zarządzanie stanem:
   - Zidentyfikuj wymagany stan dla każdego komponentu.
   - Zaimplementuj zarządzanie stanem przy użyciu odpowiedniej metody (stan lokalny, custom hook, stan współdzielony).
   - Upewnij się, że zmiany stanu wyzwalają niezbędne ponowne renderowanie.

5. Stylowanie i layout:
   - Zastosuj określone stylowanie i layout, jak wspomniano w planie wdrożenia.
   - Zapewnienie responsywności, jeśli wymaga tego plan.

6. Obsługa błędów i przypadki brzegowe:
   - Wdrożenie obsługi błędów dla wywołań API i interakcji użytkownika.
   - Rozważ i obsłuż potencjalne edge case'y wymienione w planie.

7. Optymalizacja wydajności:
   - Wdrożenie wszelkich optymalizacji wydajności określonych w planie lub zasadach.
   - Zapewnienie wydajnego renderowania i minimalnej liczby niepotrzebnych ponownych renderowań.

8. Testowanie:
   - Jeśli zostało to określone w planie, zaimplementuj testy jednostkowe dla komponentów i funkcji.
   - Dokładnie przetestuj wszystkie interakcje użytkownika i integracje API.

W trakcie całego procesu implementacji należy ściśle przestrzegać dostarczonych zasad implementacji. Zasady te mają pierwszeństwo przed wszelkimi ogólnymi najlepszymi praktykami, które mogą być z nimi sprzeczne.

Upewnij się, że twoja implementacja dokładnie odzwierciedla dostarczony plan implementacji i przestrzega wszystkich określonych zasad. Zwróć szczególną uwagę na strukturę komponentów, integrację API i obsługę interakcji użytkownika.
