Przeprowadź integrację @recover.astro @PasswordRecoveryForm.vue z backendem Astro na podstawie specyfikacji @auth-spec.md. Rozpocznij od analizy istniejącego kodu w kontekście najlepszych praktyk @shared.mdc, @frontend.mdc i @backend.mdc

Przedstawiony plan powinien spełniać założenia wyszczególnione w sekcji user stories: @prd.md

Zanim rozpoczniemy, zadaj mi 5 kluczowych pytań technicznych adresujących niejasne elementy integracji, które pomogą ci przeprowadzić całą implementację od początku do końca.

---

## Stan wdrożenia

1. **Warstwa backendowa**
   - Dodano helper `createSupabaseServerClient` (`src/db/supabase.server.ts`) umożliwiający korzystanie z anon lub service role key zgodnie z wymaganiami bezpieczeństwa.
   - Utworzono endpoint `POST /api/auth/recover`, który:
     - Waliduje dane poprzez `passwordRecoverySchema`.
     - Wywołuje `supabase.auth.resetPasswordForEmail` z przekierowaniem na `/auth/reset`.
     - Zwraca komunikaty zgodne z mapą błędów (`getAuthErrorMessage`).

2. **Warstwa frontendowa**
   - `PasswordRecoveryForm.vue` wysyła teraz żądanie do backendu, obsługuje stany `processing/success/error` oraz wyświetla odpowiedzi serwera.
   - Dodano komponent `PasswordResetForm.vue`, który:
     - Weryfikuje token (obsługa `code` i hash parametrów) i ustanawia sesję Supabase.
     - Pozwala ustawić nowe hasło przy użyciu `changePasswordSchema` i `useAuth().changePassword`.
     - Zapewnia dostępne komunikaty dla powodzenia i błędów.

3. **Nowa ścieżka użytkownika**
   - Utworzono stronę `/auth/reset` renderującą `PasswordResetForm` w ramach `AuthLayout`.
   - Strona zawiera linki powrotne do logowania i formularza odzyskiwania.

4. **Konfiguracja**
   - Zaktualizowano `env.d.ts` (dodanie `SUPABASE_SERVICE_ROLE_KEY`); `.env.dist` wymaga ręcznej aktualizacji o tę zmienną.

5. **Zgodność z user stories**
   - Pokryto wymagania US-001/US-002 w kontekście resetu hasła oraz przygotowano podwaliny pod dalsze flow (reset + login).
