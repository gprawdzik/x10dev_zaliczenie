<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import { useAuth } from '@/composables/useAuth'
import { supabaseClient } from '@/db/supabase.client.js'
import type { ChangePasswordInput } from '@/validators/auth'
import { changePasswordSchema } from '@/validators/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getAuthErrorMessage } from '@/lib/authErrors'

type SessionState = 'checking' | 'ready' | 'invalid'
type SubmissionState = 'idle' | 'processing' | 'success' | 'error'
type StatusVariant = 'info' | 'success' | 'error'

const { changePassword } = useAuth()

const sessionState = ref<SessionState>('checking')
const submissionState = ref<SubmissionState>('idle')
const statusVariant = ref<StatusVariant>('info')
const statusMessage = ref('Trwa weryfikacja linku resetującego...')

const formValues = reactive<ChangePasswordInput>({
  newPassword: '',
  confirmNewPassword: '',
})

const fieldErrors = reactive<Record<keyof ChangePasswordInput, string>>({
  newPassword: '',
  confirmNewPassword: '',
})

const isFormDisabled = computed(
  () => sessionState.value !== 'ready' || submissionState.value === 'processing'
)

const statusClasses = computed(() => {
  if (statusVariant.value === 'success') {
    return 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/50 dark:bg-emerald-950/40 dark:text-emerald-100'
  }

  if (statusVariant.value === 'error') {
    return 'border-destructive/50 bg-destructive/10 text-destructive'
  }

  return 'border-border bg-muted/30 text-muted-foreground'
})

const clearFieldErrors = () => {
  fieldErrors.newPassword = ''
  fieldErrors.confirmNewPassword = ''
}

const setStatus = (message: string, variant: StatusVariant) => {
  statusMessage.value = message
  statusVariant.value = variant
}

const removeAuthParamsFromUrl = () => {
  if (typeof window === 'undefined') {
    return
  }

  const url = new URL(window.location.href)
  url.searchParams.delete('code')
  window.history.replaceState({}, document.title, url.pathname)
  window.location.hash = ''
}

const establishRecoverySession = async () => {
  try {
    const currentUrl = new URL(window.location.href)
    const code = currentUrl.searchParams.get('code')

    if (code) {
      const { error } = await supabaseClient.auth.exchangeCodeForSession(code)

      if (error) {
        throw error
      }

      sessionState.value = 'ready'
      setStatus('', 'info')
      removeAuthParamsFromUrl()
      return
    }

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')

    if (accessToken && refreshToken) {
      const { error } = await supabaseClient.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (error) {
        throw error
      }

      sessionState.value = 'ready'
      setStatus('', 'info')
      removeAuthParamsFromUrl()
      return
    }

    throw new Error(
      'Link resetujący jest nieprawidłowy lub wygasł. Użyj ponownie opcji odzyskiwania konta.'
    )
  } catch (error) {
    console.error('Password reset session error:', error)
    sessionState.value = 'invalid'
    setStatus(
      getAuthErrorMessage(error) ||
        'Nie udało się zweryfikować linku resetującego. Spróbuj ponownie.',
      'error'
    )
  }
}

const handleSubmit = async () => {
  if (sessionState.value !== 'ready') {
    return
  }

  clearFieldErrors()
  setStatus('', 'info')

  const validation = changePasswordSchema.safeParse(formValues)
  if (!validation.success) {
    submissionState.value = 'error'
    validation.error.issues.forEach((issue) => {
      const fieldPath = issue.path[0] as keyof ChangePasswordInput | undefined
      if (fieldPath && fieldPath in fieldErrors) {
        fieldErrors[fieldPath] = issue.message
      }
    })
    setStatus('Popraw zaznaczone pola i spróbuj ponownie.', 'error')
    return
  }

  submissionState.value = 'processing'
  setStatus('Aktualizujemy Twoje hasło...', 'info')

  try {
    await changePassword(validation.data.newPassword)
    submissionState.value = 'success'
    setStatus('Hasło zostało zaktualizowane. Możesz się teraz zalogować.', 'success')
  } catch (error) {
    console.error('Password reset error:', error)
    submissionState.value = 'error'
    setStatus(getAuthErrorMessage(error), 'error')
  }
}

onMounted(async () => {
  if (typeof window === 'undefined') {
    return
  }

  await establishRecoverySession()
})
</script>

<template>
  <form class="flex flex-col gap-6" @submit.prevent="handleSubmit" novalidate>
    <div
      v-if="statusMessage"
      class="rounded-md border p-3 text-sm"
      :class="statusClasses"
      role="status"
      aria-live="polite"
    >
      {{ statusMessage }}
    </div>

    <div v-if="sessionState === 'invalid'" class="text-sm text-muted-foreground">
      <p class="mb-2">
        Jeśli potrzebujesz nowego linku resetującego, przejdź ponownie przez proces odzyskiwania
        konta.
      </p>
      <a href="/auth/recover" class="font-semibold text-primary underline-offset-2 hover:underline">
        Wróć do formularza odzyskiwania
      </a>
    </div>

    <div v-else>
      <div class="flex flex-col gap-2">
        <Label for="new-password">Nowe hasło</Label>
        <Input
          id="new-password"
          v-model="formValues.newPassword"
          type="password"
          name="newPassword"
          autocomplete="new-password"
          :disabled="isFormDisabled"
          :aria-invalid="Boolean(fieldErrors.newPassword)"
        />
        <p v-if="fieldErrors.newPassword" class="text-sm text-destructive" aria-live="polite">
          {{ fieldErrors.newPassword }}
        </p>
      </div>

      <div class="mt-4 flex flex-col gap-2">
        <Label for="confirm-new-password">Potwierdź nowe hasło</Label>
        <Input
          id="confirm-new-password"
          v-model="formValues.confirmNewPassword"
          type="password"
          name="confirmNewPassword"
          autocomplete="new-password"
          :disabled="isFormDisabled"
          :aria-invalid="Boolean(fieldErrors.confirmNewPassword)"
        />
        <p
          v-if="fieldErrors.confirmNewPassword"
          class="text-sm text-destructive"
          aria-live="polite"
        >
          {{ fieldErrors.confirmNewPassword }}
        </p>
      </div>
    </div>

    <Button type="submit" :disabled="isFormDisabled">
      <span v-if="submissionState === 'processing'">Aktualizujemy hasło...</span>
      <span v-else-if="submissionState === 'success'">Hasło zaktualizowane</span>
      <span v-else>Ustaw nowe hasło</span>
    </Button>

    <p v-if="submissionState === 'success'" class="text-sm text-muted-foreground">
      Możesz teraz przejść do
      <a href="/auth/login" class="font-semibold text-primary underline-offset-2 hover:underline">
        strony logowania
      </a>
      i zalogować się nowym hasłem.
    </p>
  </form>
</template>

