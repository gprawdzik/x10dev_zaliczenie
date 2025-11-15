<script setup lang="ts">
import { reactive, ref } from 'vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CreateSportDto } from '@/types';
import { useToastStore } from '@/stores/toast';

// Typ ViewModel dla formularza
interface AddSportFormViewModel {
  code: string;
  name: string;
  description: string;
}

// Definicja eventu emitowanego po utworzeniu sportu
const emit = defineEmits<{
  'sport-created': [];
}>();

// Stan formularza
const form = reactive<AddSportFormViewModel>({
  code: '',
  name: '',
  description: '',
});

// Stan ładowania i błędów
const isLoading = ref(false);
const errors = reactive<Partial<Record<keyof AddSportFormViewModel | 'general', string>>>({});

// Toast store do wyświetlania powiadomień
const toast = useToastStore();

/**
 * Walidacja formularza po stronie klienta
 */
const validateForm = (): boolean => {
  // Wyczyść poprzednie błędy
  Object.keys(errors).forEach(key => delete errors[key as keyof typeof errors]);

  let isValid = true;

  // Walidacja: code jest wymagany
  if (!form.code.trim()) {
    errors.code = 'Kod sportu jest wymagany';
    isValid = false;
  }

  // Walidacja: name jest wymagany
  if (!form.name.trim()) {
    errors.name = 'Nazwa sportu jest wymagana';
    isValid = false;
  }

  return isValid;
};

/**
 * Obsługa wysłania formularza
 */
const handleSubmit = async () => {
  // Walidacja przed wysłaniem
  if (!validateForm()) {
    return;
  }

  isLoading.value = true;
  errors.general = '';

  try {
    // Przygotuj dane do wysłania
    const sportData: CreateSportDto = {
      code: form.code.trim(),
      name: form.name.trim(),
      description: form.description.trim() || null,
      consolidated: null,
    };

    // Wywołanie API
    const response = await fetch('/api/sports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sportData),
    });

    if (!response.ok) {
      // Obsługa błędu 409 (Conflict) - duplikat kodu
      if (response.status === 409) {
        errors.code = 'Sport o tym kodzie już istnieje';
        return;
      }
      
      throw new Error('Failed to create sport');
    }

    // Sukces - wyczyść formularz
    form.code = '';
    form.name = '';
    form.description = '';

    // Wyświetl powiadomienie sukcesu
    toast.success('Sport dodany', 'Nowy sport został pomyślnie dodany do systemu');

    // Emituj event o utworzeniu sportu
    emit('sport-created');

  } catch (error) {
    console.error('Błąd podczas tworzenia sportu:', error);
    toast.error('Błąd dodawania sportu', 'Wystąpił błąd podczas dodawania sportu. Spróbuj ponownie.');
    errors.general = 'Wystąpił błąd podczas dodawania sportu. Spróbuj ponownie.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <!-- Pole: Kod -->
    <div class="space-y-2">
      <Label for="sport-code">Kod sportu *</Label>
      <Input
        id="sport-code"
        v-model="form.code"
        type="text"
        :disabled="isLoading"
        placeholder="np. running, cycling"
        :class="{ 'border-red-500': errors.code }"
      />
      <p v-if="errors.code" class="text-sm text-red-500">
        {{ errors.code }}
      </p>
    </div>

    <!-- Pole: Nazwa -->
    <div class="space-y-2">
      <Label for="sport-name">Nazwa sportu *</Label>
      <Input
        id="sport-name"
        v-model="form.name"
        type="text"
        :disabled="isLoading"
        placeholder="np. Bieganie, Kolarstwo"
        :class="{ 'border-red-500': errors.name }"
      />
      <p v-if="errors.name" class="text-sm text-red-500">
        {{ errors.name }}
      </p>
    </div>

    <!-- Pole: Opis (opcjonalne) -->
    <div class="space-y-2">
      <Label for="sport-description">Opis (opcjonalnie)</Label>
      <Input
        id="sport-description"
        v-model="form.description"
        type="text"
        :disabled="isLoading"
        placeholder="Krótki opis dyscypliny"
      />
    </div>

    <!-- Błąd ogólny -->
    <p v-if="errors.general" class="text-sm text-red-500">
      {{ errors.general }}
    </p>

    <!-- Przycisk submit -->
    <div class="flex justify-end">
      <Button type="submit" :disabled="isLoading">
        {{ isLoading ? 'Dodaję...' : 'Dodaj sport' }}
      </Button>
    </div>
  </form>
</template>

