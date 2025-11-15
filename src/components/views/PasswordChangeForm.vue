<script setup lang="ts">
import { ref, reactive } from 'vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToastStore } from '@/stores/toast';

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
    // TODO: Implementacja prawdziwego API call
    // const response = await fetch('/api/user/password', {
    //   method: 'PATCH',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     currentPassword: form.currentPassword,
    //     newPassword: form.newPassword,
    //   }),
    // });

    // Symulacja API call na potrzeby dewelopmentu
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Sukces - wyczyść formularz
    form.currentPassword = '';
    form.newPassword = '';
    form.confirmNewPassword = '';

    // Wyświetl powiadomienie sukcesu
    toast.success('Hasło zostało zmienione', 'Twoje hasło zostało pomyślnie zaktualizowane');

  } catch (error) {
    console.error('Błąd podczas zmiany hasła:', error);
    toast.error('Błąd zmiany hasła', 'Wystąpił błąd podczas zmiany hasła. Spróbuj ponownie.');
    errors.general = 'Wystąpił błąd podczas zmiany hasła. Spróbuj ponownie.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <!-- Pole: Obecne hasło -->
    <div class="space-y-2">
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
    <div class="space-y-2">
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
    <div class="space-y-2">
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
    <div class="flex justify-end">
      <Button type="submit" :disabled="isLoading">
        {{ isLoading ? 'Zmieniam hasło...' : 'Zmień hasło' }}
      </Button>
    </div>
  </form>
</template>

