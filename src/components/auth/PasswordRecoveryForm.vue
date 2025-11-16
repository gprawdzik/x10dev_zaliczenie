<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

import type { PasswordRecoveryInput } from '@/validators/auth'
import { passwordRecoverySchema } from '@/validators/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type SubmissionState = 'idle' | 'processing' | 'success' | 'error'
type StatusVariant = 'info' | 'success' | 'error'

const formValues = reactive<PasswordRecoveryInput>({
  email: '',
})

const fieldError = ref('')
const submissionState = ref<SubmissionState>('idle')
const statusMessage = ref('')
const statusVariant = ref<StatusVariant>('info')
const statusVariantClasses = computed(() => {
  if (statusVariant.value === 'success') {
    return 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/50 dark:bg-emerald-950/40 dark:text-emerald-100'
  }

  if (statusVariant.value === 'error') {
    return 'border-destructive/50 bg-destructive/10 text-destructive'
  }

  return 'border-border bg-muted/30 text-muted-foreground'
})

const setStatus = (message: string, variant: StatusVariant) => {
  statusMessage.value = message
  statusVariant.value = variant
}

const handleSubmit = async () => {
  fieldError.value = ''
  submissionState.value = 'processing'
  setStatus('Weryfikujemy adres email...', 'info')

  const validation = passwordRecoverySchema.safeParse(formValues)
  if (!validation.success) {
    fieldError.value = validation.error.issues[0]?.message ?? 'Email jest wymagany'
    submissionState.value = 'error'
    setStatus('Nie udało się wysłać formularza. Upewnij się, że email jest prawidłowy.', 'error')
    return
  }

  try {
    const response = await fetch('/api/auth/recover', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: validation.data.email }),
    })

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string
      message?: string
    }

    if (!response.ok) {
      submissionState.value = 'error'

      const errorMessage =
        payload?.error ?? 'Nie udało się wysłać instrukcji resetu. Spróbuj ponownie później.'

      if (response.status === 400) {
        fieldError.value = errorMessage
      }

      setStatus(errorMessage, 'error')
      return
    }

    submissionState.value = 'success'
    setStatus(
      payload?.message ??
        'Jeżeli konto istnieje, wysłaliśmy na nie instrukcje resetu. Sprawdź skrzynkę email.',
      'success',
    )
    formValues.email = ''
  } catch (error) {
    console.error('Password recovery form error:', error)
    submissionState.value = 'error'
    setStatus('Nie udało się połączyć z serwerem. Spróbuj ponownie.', 'error')
  }
}
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
      class="rounded-md border p-3 text-sm"
      :class="statusVariantClasses"
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
