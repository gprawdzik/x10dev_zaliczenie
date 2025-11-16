<script setup lang="ts">
import { reactive, ref } from 'vue';
import type { RegisterInput } from '@/validators/auth';
import { registerSchema } from '@/validators/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Lokalny stan formularza.
 * Przechowujemy go jako obiekt, aby v-model działał bez dodatkowych getterów.
 */
const formValues = reactive<RegisterInput>({
  email: '',
  password: '',
  confirmPassword: '',
});

/**
 * Słownik błędów przypisany do poszczególnych pól.
 */
const fieldErrors = reactive<Partial<Record<keyof RegisterInput, string>>>({});

/**
 * Komunikaty statusu pomagają użytkownikowi zrozumieć, co dzieje się po kliknięciu przycisku.
 */
const submissionState = ref<'idle' | 'processing' | 'success' | 'error'>('idle');
const statusMessage = ref('');

const passwordHints = [
  'Minimum 10 znaków',
  'Przynajmniej jedna wielka litera',
  'Przynajmniej jedna mała litera',
  'Przynajmniej jedna cyfra',
];

/**
 * Czyści wszystkie komunikaty błędów.
 */
const resetErrors = () => {
  Object.keys(fieldErrors).forEach(key => {
    delete fieldErrors[key as keyof RegisterInput];
  });
};

/**
 * Waliduje dane przed wysłaniem.
 */
const validateForm = (): boolean => {
  resetErrors();
  const result = registerSchema.safeParse(formValues);

  if (!result.success) {
    result.error.issues.forEach(issue => {
      const field = issue.path[0] as keyof RegisterInput;
      fieldErrors[field] = issue.message;
    });
    submissionState.value = 'error';
    statusMessage.value = 'Popraw zaznaczone pola i spróbuj ponownie.';
    return false;
  }

  return true;
};

/**
 * Symuluje wysłanie formularza.
 * Backend zostanie podłączony w kolejnych etapach, dlatego tutaj tylko czekamy.
 */
const simulateSubmissionDelay = () =>
  new Promise(resolve => {
    setTimeout(resolve, 800);
  });

/**
 * Obsługuje kliknięcie przycisku "Załóż konto".
 */
const handleSubmit = async () => {
  submissionState.value = 'processing';
  statusMessage.value = 'Sprawdzamy dane...';

  if (!validateForm()) {
    return;
  }

  await simulateSubmissionDelay();
  submissionState.value = 'success';
  statusMessage.value = 'Formularz wygląda dobrze. Integracja z backendem zostanie dodana później.';
};
</script>

<template>
  <form class="flex flex-col gap-6" @submit.prevent="handleSubmit" novalidate>
    <div class="flex flex-col gap-2">
      <Label for="register-email">Adres email</Label>
      <Input
        id="register-email"
        v-model="formValues.email"
        type="email"
        name="email"
        autocomplete="email"
        placeholder="jan.kowalski@example.com"
        :aria-invalid="!!fieldErrors.email"
      />
      <p v-if="fieldErrors.email" class="text-sm text-destructive" aria-live="polite">
        {{ fieldErrors.email }}
      </p>
    </div>

    <div class="flex flex-col gap-2">
      <Label for="register-password">Hasło</Label>
      <Input
        id="register-password"
        v-model="formValues.password"
        type="password"
        name="password"
        autocomplete="new-password"
        placeholder="Silne hasło"
        :aria-invalid="!!fieldErrors.password"
      />
      <p v-if="fieldErrors.password" class="text-sm text-destructive" aria-live="polite">
        {{ fieldErrors.password }}
      </p>
      <ul class="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        <li v-for="hint in passwordHints" :key="hint">{{ hint }}</li>
      </ul>
    </div>

    <div class="flex flex-col gap-2">
      <Label for="register-confirm-password">Potwierdź hasło</Label>
      <Input
        id="register-confirm-password"
        v-model="formValues.confirmPassword"
        type="password"
        name="confirmPassword"
        autocomplete="new-password"
        placeholder="Powtórz hasło"
        :aria-invalid="!!fieldErrors.confirmPassword"
      />
      <p
        v-if="fieldErrors.confirmPassword"
        class="text-sm text-destructive"
        aria-live="polite"
      >
        {{ fieldErrors.confirmPassword }}
      </p>
    </div>

    <div
      v-if="statusMessage"
      class="rounded-md border border-border bg-muted/30 p-3 text-sm"
      :class="{
        'text-foreground': submissionState === 'success',
        'text-muted-foreground': submissionState === 'processing',
        'text-destructive': submissionState === 'error',
      }"
      role="status"
      aria-live="polite"
    >
      {{ statusMessage }}
    </div>

    <Button type="submit" :disabled="submissionState === 'processing'">
      <span v-if="submissionState === 'processing'">Tworzymy konto...</span>
      <span v-else>Załóż konto</span>
    </Button>
  </form>
</template>

