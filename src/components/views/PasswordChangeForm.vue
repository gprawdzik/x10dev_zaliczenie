<script setup lang="ts">
import { ref, reactive } from 'vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToastStore } from '@/stores/toast';
import { useAuth } from '@/composables/useAuth';

// Typ ViewModel dla formularza
interface PasswordChangeViewModel {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

// Stan formularza
const form = reactive<PasswordChangeViewModel>({
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
});

// Stan ładowania i błędów
const isLoading = ref(false);
const errors = reactive<Partial<Record<keyof PasswordChangeViewModel | 'general', string>>>({});

// Toast store do wyświetlania powiadomień
const toast = useToastStore();

// Auth composable do operacji na użytkowniku
const { changePassword } = useAuth();

/**
 * Walidacja formularza po stronie klienta
 * Zwraca true jeśli formularz jest poprawny
 */
const validateForm = (): boolean => {
  // Wyczyść poprzednie błędy
  Object.keys(errors).forEach(key => delete errors[key as keyof typeof errors]);

  let isValid = true;

  // Walidacja: wszystkie pola wymagane
  if (!form.currentPassword) {
    errors.currentPassword = 'Obecne hasło jest wymagane';
    isValid = false;
  }

  if (!form.newPassword) {
    errors.newPassword = 'Nowe hasło jest wymagane';
    isValid = false;
  } else if (form.newPassword.length < 10) {
    // Walidacja: min. 10 znaków
    errors.newPassword = 'Nowe hasło musi mieć co najmniej 10 znaków';
    isValid = false;
  }

  if (!form.confirmNewPassword) {
    errors.confirmNewPassword = 'Potwierdzenie hasła jest wymagane';
    isValid = false;
  } else if (form.newPassword !== form.confirmNewPassword) {
    // Walidacja: hasła muszą się zgadzać
    errors.confirmNewPassword = 'Hasła nie są identyczne';
    isValid = false;
  }

  return isValid;
};

/**
 * Obsługa wysłania formularza
 * Waliduje dane i wysyła żądanie do API
 */
const handleSubmit = async () => {
  // Walidacja przed wysłaniem
  if (!validateForm()) {
    return;
  }

  isLoading.value = true;
  errors.general = '';

  try {
    // Wywołaj Supabase Auth do zmiany hasła
    await changePassword(form.currentPassword, form.newPassword);

    // Sukces - wyczyść formularz
    form.currentPassword = '';
    form.newPassword = '';
    form.confirmNewPassword = '';

    // Wyświetl powiadomienie sukcesu
    toast.success('Hasło zostało zmienione', 'Twoje hasło zostało pomyślnie zaktualizowane');

  } catch (error: any) {
    console.error('Błąd podczas zmiany hasła:', error);
    
    // Obsłuż różne typy błędów
    const errorMessage = error?.message || 'Wystąpił błąd podczas zmiany hasła. Spróbuj ponownie.';
    
    toast.error('Błąd zmiany hasła', errorMessage);
    errors.general = errorMessage;
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="flex flex-col gap-6">
    <!-- Pole: Obecne hasło -->
    <div class="flex flex-col gap-3">
      <Label for="current-password">Obecne hasło</Label>
      <Input
        id="current-password"
        v-model="form.currentPassword"
        type="password"
        :disabled="isLoading"
        placeholder="Wprowadź obecne hasło"
        :class="{ 'border-red-500': errors.currentPassword }"
      />
      <p v-if="errors.currentPassword" class="text-sm text-red-500">
        {{ errors.currentPassword }}
      </p>
    </div>

    <!-- Pole: Nowe hasło -->
    <div class="flex flex-col gap-3">
      <Label for="new-password">Nowe hasło</Label>
      <Input
        id="new-password"
        v-model="form.newPassword"
        type="password"
        :disabled="isLoading"
        placeholder="Wprowadź nowe hasło (min. 10 znaków)"
        :class="{ 'border-red-500': errors.newPassword }"
      />
      <p v-if="errors.newPassword" class="text-sm text-red-500">
        {{ errors.newPassword }}
      </p>
    </div>

    <!-- Pole: Potwierdź nowe hasło -->
    <div class="flex flex-col gap-3">
      <Label for="confirm-password">Potwierdź nowe hasło</Label>
      <Input
        id="confirm-password"
        v-model="form.confirmNewPassword"
        type="password"
        :disabled="isLoading"
        placeholder="Wprowadź ponownie nowe hasło"
        :class="{ 'border-red-500': errors.confirmNewPassword }"
      />
      <p v-if="errors.confirmNewPassword" class="text-sm text-red-500">
        {{ errors.confirmNewPassword }}
      </p>
    </div>

    <!-- Błąd ogólny -->
    <p v-if="errors.general" class="text-sm text-red-500">
      {{ errors.general }}
    </p>

    <!-- Przycisk submit -->
    <div class="flex justify-end pt-2">
      <Button type="submit" :disabled="isLoading">
        {{ isLoading ? 'Zmieniam hasło...' : 'Zmień hasło' }}
      </Button>
    </div>
  </form>
</template>

