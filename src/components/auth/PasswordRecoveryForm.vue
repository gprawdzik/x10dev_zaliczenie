<script setup lang="ts">
import { reactive, ref } from 'vue';
import type { PasswordRecoveryInput } from '@/validators/auth';
import { passwordRecoverySchema } from '@/validators/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const formValues = reactive<PasswordRecoveryInput>({
  email: '',
});

const fieldError = ref<string>('');
const submissionState = ref<'idle' | 'processing' | 'success' | 'error'>('idle');
const statusMessage = ref('');

const simulateSubmissionDelay = () =>
  new Promise(resolve => {
    setTimeout(resolve, 700);
  });

const handleSubmit = async () => {
  fieldError.value = '';
  submissionState.value = 'processing';
  statusMessage.value = 'Przygotowujemy instrukcje resetu hasła...';

  const validation = passwordRecoverySchema.safeParse(formValues);
  if (!validation.success) {
    fieldError.value = validation.error.issues[0]?.message ?? 'Email jest wymagany';
    submissionState.value = 'error';
    statusMessage.value = 'Nie udało się wysłać formularza. Upewnij się, że email jest prawidłowy.';
    return;
  }

  await simulateSubmissionDelay();
  submissionState.value = 'success';
  statusMessage.value =
    'Jeżeli konto istnieje, wyślemy na nie instrukcje resetu po podłączeniu backendu.';
};
</script>

<template>
  <form class="flex flex-col gap-6" @submit.prevent="handleSubmit" novalidate>
    <div class="flex flex-col gap-2">
      <Label for="recovery-email">Adres email</Label>
      <Input
        id="recovery-email"
        v-model="formValues.email"
        type="email"
        name="email"
        autocomplete="email"
        placeholder="jan.kowalski@example.com"
        :aria-invalid="!!fieldError"
      />
      <p v-if="fieldError" class="text-sm text-destructive" aria-live="polite">
        {{ fieldError }}
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
      <span v-if="submissionState === 'processing'">Wysyłamy instrukcje...</span>
      <span v-else>Wyślij link resetujący</span>
    </Button>
  </form>
</template>

