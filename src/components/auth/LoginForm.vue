<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import type { LoginInput } from '@/validators/auth';
import { loginSchema } from '@/validators/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  redirectTarget?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  redirectTarget: null,
});

const formValues = reactive<LoginInput>({
  email: '',
  password: '',
});

const fieldErrors = reactive<Partial<Record<keyof LoginInput, string>>>({});
const submissionState = ref<'idle' | 'processing' | 'success' | 'error'>('idle');
const statusMessage = ref('');

/**
 * Przyjazny tekst o przekierowaniu po logowaniu.
 * Dzięki computed unikamy zbędnych obliczeń, gdy brak parametru.
 */
const redirectInfo = computed(() => {
  if (!props.redirectTarget) {
    return '';
  }
  return `Po zalogowaniu wrócisz automatycznie do „${props.redirectTarget}”.`;
});

const resetErrors = () => {
  Object.keys(fieldErrors).forEach(key => {
    delete fieldErrors[key as keyof LoginInput];
  });
};

const simulateSubmissionDelay = () =>
  new Promise(resolve => {
    setTimeout(resolve, 600);
  });

const validateForm = (): boolean => {
  resetErrors();
  const result = loginSchema.safeParse(formValues);

  if (!result.success) {
    result.error.issues.forEach(issue => {
      const field = issue.path[0] as keyof LoginInput;
      fieldErrors[field] = issue.message;
    });
    submissionState.value = 'error';
    statusMessage.value = 'Nie udało się zweryfikować formularza. Popraw błędy.';
    return false;
  }

  return true;
};

const handleSubmit = async () => {
  submissionState.value = 'processing';
  statusMessage.value = 'Przygotowujemy dane do wysłania...';

  if (!validateForm()) {
    return;
  }

  await simulateSubmissionDelay();
  submissionState.value = 'success';
  statusMessage.value = 'Dane wyglądają poprawnie. Integracja z backendem nastąpi później.';
};
</script>

<template>
  <form class="flex flex-col gap-6" @submit.prevent="handleSubmit" novalidate>
    <div v-if="redirectInfo" class="rounded-md border border-dashed border-border bg-muted/40 p-3 text-sm">
      {{ redirectInfo }}
    </div>

    <div class="flex flex-col gap-2">
      <Label for="login-email">Adres email</Label>
      <Input
        id="login-email"
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
      <Label for="login-password">Hasło</Label>
      <Input
        id="login-password"
        v-model="formValues.password"
        type="password"
        name="password"
        autocomplete="current-password"
        placeholder="••••••••••"
        :aria-invalid="!!fieldErrors.password"
      />
      <p v-if="fieldErrors.password" class="text-sm text-destructive" aria-live="polite">
        {{ fieldErrors.password }}
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
      <span v-if="submissionState === 'processing'">Trwa logowanie...</span>
      <span v-else>Zaloguj się</span>
    </Button>
  </form>
</template>

