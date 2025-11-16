# Plan implementacji widoku Ustawienia

## 1. Przegląd

Widok Ustawienia (`/settings`) to centralne miejsce dla użytkownika do zarządzania swoim kontem, danymi oraz, w przypadku administratorów, konfiguracją aplikacji. Widok jest podzielony na trzy główne sekcje w formie zakładek:

1.  **Profil**: Umożliwia użytkownikowi zmianę hasła i usunięcie konta.
2.  **Generator danych**: Pozwala na wygenerowanie symulowanych danych aktywności na potrzeby testowania i wizualizacji.
3.  **Sporty**: Dostępna tylko dla administratorów, służy do zarządzania dyscyplinami sportowymi w systemie, w tym dodawania nowych.

## 2. Routing widoku

Widok będzie dostępny pod następującą ścieżką:

-   **Ścieżka**: `/settings`
-   **Plik**: `src/pages/settings.astro`

Strona będzie dostępna tylko dla zalogowanych użytkowników.

## 3. Struktura komponentów

Hierarchia komponentów dla widoku Ustawienia będzie wyglądać następująco:

```
src/pages/settings.astro
└── src/components/views/SettingsView.vue (client:load)
    ├── Tabs (komponent UI, np. z shadcn/vue)
    │   ├── TabsContent (Profil)
    │   │   └── ProfilePanel.vue
    │   │       ├── PasswordChangeForm.vue
    │   │       └── AccountDeleteSection.vue
    │   │           └── ConfirmationModal.vue
    │   ├── TabsContent (Generator danych)
    │   │   └── ActivityGeneratorPanel.vue
    │   │       └── ConfirmationModal.vue
    │   └── TabsContent (Sporty) [v-if="isAdmin"]
    │       └── SportManagerPanel.vue
    │           ├── AddSportForm.vue
    │           └── SportList.vue
    └── Toast (globalny komponent do powiadomień)
```

## 4. Szczegóły komponentów

### SettingsView.vue

-   **Opis komponentu**: Główny komponent widoku, który zarządza zakładkami i warunkowo renderuje panel administratora. Pobiera informacje o roli użytkownika.
-   **Główne elementy**: Komponent `Tabs` z `shadcn/vue` do nawigacji między panelami: `ProfilePanel`, `ActivityGeneratorPanel`, `SportManagerPanel`.
-   **Obsługiwane zdarzenia**: Zmiana aktywnej zakładki.
-   **Warunki walidacji**: Sprawdzenie, czy użytkownik ma rolę 'admin', aby wyświetlić zakładkę "Sporty".
-   **Typy**: `User` (do odczytu roli).
-   **Propsy**: Brak.

### ProfilePanel.vue

-   **Opis komponentu**: Panel zawierający formularz zmiany hasła oraz opcję usunięcia konta.
-   **Główne elementy**: `PasswordChangeForm.vue`, `AccountDeleteSection.vue`.
-   **Obsługiwane zdarzenia**: Brak (logika zawarta w komponentach podrzędnych).
-   **Typy**: Brak.
-   **Propsy**: Brak.

### PasswordChangeForm.vue

-   **Opis komponentu**: Formularz do zmiany hasła użytkownika.
-   **Główne elementy**: Pola `input` dla obecnego hasła, nowego hasła i potwierdzenia nowego hasła. Przycisk `button` do wysłania formularza.
-   **Obsługiwane zdarzenia**: `@submit` - wywołuje logikę zmiany hasła.
-   **Warunki walidacji**:
    -   Wszystkie pola są wymagane.
    -   Nowe hasło musi mieć co najmniej 10 znaków.
    -   Nowe hasło i jego potwierdzenie muszą być identyczne.
-   **Typy**: `PasswordChangeViewModel`.
-   **Propsy**: Brak.

### AccountDeleteSection.vue

-   **Opis komponentu**: Sekcja z przyciskiem do usunięcia konta, który otwiera modal z potwierdzeniem.
-   **Główne elementy**: `Button` i `ConfirmationModal`.
-   **Obsługiwane zdarzenia**: Kliknięcie przycisku "Usuń konto", potwierdzenie usunięcia w modalu.
-   **Typy**: Brak.
-   **Propsy**: Brak.

### ActivityGeneratorPanel.vue

-   **Opis komponentu**: Panel do uruchamiania generatora aktywności. Zawiera przycisk, który jest chroniony modalem potwierdzającym.
-   **Główne elementy**: `Button` do uruchomienia, `ConfirmationModal` do potwierdzenia, `Loader` wyświetlany w trakcie generowania.
-   **Obsługiwane zdarzenia**: Kliknięcie przycisku "Generuj dane", potwierdzenie w modalu.
-   **Typy**: Brak.
-   **Propsy**: Brak.

### SportManagerPanel.vue

-   **Opis komponentu**: Panel (tylko dla admina) do zarządzania sportami. Wyświetla listę istniejących sportów i formularz do dodawania nowego.
-   **Główne elementy**: `AddSportForm.vue`, `SportList.vue`.
-   **Obsługiwane zdarzenia**: `@sport-created` z `AddSportForm` w celu odświeżenia listy.
-   **Warunki walidacji**: Komponent renderowany warunkowo dla administratorów.
-   **Typy**: `SportDto[]`.
-   **Propsy**: Brak.

### AddSportForm.vue

-   **Opis komponentu**: Formularz do dodawania nowego sportu.
-   **Główne elementy**: Pola `input` dla `code`, `name`, `description`. Przycisk `button` do wysłania.
-   **Obsługiwane zdarzenia**: `@submit` - wysyła żądanie utworzenia sportu; `@sport-created` - emitowane po pomyślnym utworzeniu.
-   **Warunki walidacji**:
    -   `code`: wymagany, unikalny (walidacja po stronie API).
    -   `name`: wymagany.
-   **Typy**: `AddSportFormViewModel`, `CreateSportDto`.
-   **Propsy**: Brak.

### SportList.vue

-   **Opis komponentu**: Wyświetla listę lub tabelę dostępnych sportów.
-   **Główne elementy**: Tabela (`<table>`) lub lista (`<ul>`) renderująca dane.
-   **Typy**: `SportDto`.
-   **Propsy**: `sports: SportDto[]`.

## 5. Typy

Do implementacji widoku, oprócz istniejących typów DTO, potrzebne będą następujące typy ViewModel dla formularzy:

```typescript
// ViewModel dla formularza zmiany hasła
export interface PasswordChangeViewModel {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

// ViewModel dla formularza dodawania sportu
export interface AddSportFormViewModel {
  code: string;
  name: string;
  description: string | null;
}

// DTO zdefiniowane w src/types.ts, używane w komponencie SportManagerPanel
export type SportDto = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  consolidated: string | null;
  created_at: string;
};

export type CreateSportDto = Omit<SportDto, "id" | "created_at">;
```

## 6. Zarządzanie stanem

Stan będzie zarządzany głównie lokalnie w poszczególnych komponentach Vue (`ref`, `reactive`).

-   **SettingsView.vue**: Przechowuje stan aktywnej zakładki oraz informację, czy użytkownik jest administratorem (`isAdmin: boolean`).
-   **PasswordChangeForm.vue**: Stan formularza (`PasswordChangeViewModel`), stan ładowania (`isLoading: boolean`) i błędy walidacji.
-   **SportManagerPanel.vue**: Lista sportów (`sports: SportDto[]`), stan ładowania listy.
-   **AddSportForm.vue**: Stan formularza (`AddSportFormViewModel`), stan ładowania i błędy.

Do globalnych powiadomień (Toast) zostanie wykorzystany dedykowany store Pinia (`useToastStore`), aby umożliwić wywoływanie notyfikacji z dowolnego komponentu. Informacje o użytkowniku, w tym jego rola, będą pobierane z `useUserStore`.

## 7. Integracja API

Komponenty będą komunikować się z następującymi (częściowo zakładanymi) endpointami API:

-   **Zmiana hasła**: `PATCH /api/user/password`
    -   **Komponent**: `PasswordChangeForm.vue`
    -   **Request Body**: `{ currentPassword: '...', newPassword: '...' }`
    -   **Response**: `200 OK` lub błąd `400/401`.

-   **Usunięcie konta**: `DELETE /api/user/account`
    -   **Komponent**: `AccountDeleteSection.vue`
    -   **Response**: `204 No Content`, po którym następuje wylogowanie i przekierowanie.

-   **Generowanie aktywności**: `POST /api/activities/generate`
    -   **Komponent**: `ActivityGeneratorPanel.vue`
    -   **Response**: `201 Created` lub błąd `500`.

-   **Pobranie listy sportów**: `GET /sports`
    -   **Komponent**: `SportManagerPanel.vue`
    -   **Response**: `200 OK` z `SportDto[]`.

-   **Utworzenie sportu**: `POST /sports`
    -   **Komponent**: `AddSportForm.vue`
    -   **Request Body**: `CreateSportDto`
    -   **Response**: `201 Created` z nowo utworzonym `SportDto`.

## 8. Interakcje użytkownika

-   **Zmiana zakładki**: Kliknięcie na nazwę zakładki powoduje wyświetlenie odpowiedniego panelu.
-   **Wysłanie formularza**: Kliknięcie przycisku "Zapisz", "Zmień hasło" lub "Dodaj sport" blokuje formularz, wyświetla wskaźnik ładowania i wysyła żądanie do API. Po otrzymaniu odpowiedzi, formularz jest odblokowywany, a użytkownik otrzymuje powiadomienie (Toast).
-   **Operacje niebezpieczne (usuwanie konta, generowanie danych)**: Kliknięcie przycisku inicjującego akcję otwiera modal z prośbą o ostateczne potwierdzenie. Dopiero potwierdzenie w modalu uruchamia właściwą logikę.

## 9. Warunki i walidacja

-   **Formularz zmiany hasła**:
    -   Wszystkie pola muszą być wypełnione.
    -   Nowe hasło musi mieć min. 10 znaków.
    -   Wartości w polach "Nowe hasło" i "Potwierdź nowe hasło" muszą być takie same.
-   **Formularz dodawania sportu**:
    -   Pola `code` i `name` są wymagane.
    -   Walidacja unikalności pola `code` jest realizowana przez API. Interfejs użytkownika musi obsłużyć błąd `409 Conflict` i wyświetlić stosowny komunikat przy polu `code`.
-   **Dostęp do panelu Sporty**:
    -   Zakładka "Sporty" i jej zawartość są widoczne tylko dla użytkowników z rolą `admin`.

## 10. Obsługa błędów

-   **Błędy walidacji formularza**: Komunikaty o błędach będą wyświetlane pod odpowiednimi polami formularza.
-   **Błędy API (np. 4xx, 5xx)**:
    -   **Błąd 409 (Conflict)** przy tworzeniu sportu: Wyświetlenie komunikatu "Sport o tym kodzie już istnieje." przy polu `code`.
    -   **Błąd 401 (Unauthorized)** lub **403 (Forbidden)**: Użytkownik zostanie automatycznie wylogowany i przekierowany na stronę logowania.
    -   **Inne błędy serwera (500)** lub **błędy sieci**: Wyświetlenie globalnego powiadomienia (Toast) z ogólną informacją, np. "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później."
-   **Stan ładowania**: Podczas operacji asynchronicznych przyciski inicjujące akcję będą zablokowane, a w interfejsie pojawi się wskaźnik ładowania (`Loader`), aby zapobiec wielokrotnemu wywołaniu akcji.

## 11. Kroki implementacji

1.  Utworzenie pliku strony `src/pages/settings.astro` i osadzenie w nim komponentu `SettingsView.vue` z dyrektywą `client:load`.
2.  Implementacja komponentu `SettingsView.vue` z wykorzystaniem `Tabs` z `shadcn/vue`. Dodanie logiki warunkowego renderowania zakładki "Sporty" na podstawie roli użytkownika (początkowo można na sztywno ustawić `isAdmin = true` do celów deweloperskich).
3.  Stworzenie komponentów `ProfilePanel.vue`, `PasswordChangeForm.vue` i `AccountDeleteSection.vue`. Implementacja logiki zmiany hasła i usuwania konta wraz z obsługą modala i powiadomień.
4.  Implementacja komponentu `ActivityGeneratorPanel.vue`, w tym obsługa modala potwierdzającego i stanu ładowania.
5.  Implementacja panelu administratora:
    -   Stworzenie komponentu `SportManagerPanel.vue`, który będzie pobierał i przechowywał listę sportów.
    -   Stworzenie komponentu `SportList.vue` do wyświetlania danych.
    -   Stworzenie komponentu `AddSportForm.vue` z walidacją i logiką wysyłania danych do API.
    -   Połączenie komponentów tak, aby po dodaniu nowego sportu lista była automatycznie aktualizowana.
6.  Zintegrowanie globalnego systemu powiadomień (Toast) przy użyciu Pinia, aby wszystkie komponenty mogły z niego korzystać.
7.  Podłączenie do prawdziwego store'a użytkownika (`useUserStore`) w celu pobrania roli i dynamicznego sterowania widocznością panelu administratora.
8.  Finalne testy manualne wszystkich interakcji, walidacji i obsługi błędów.
