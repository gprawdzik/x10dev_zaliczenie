<script setup lang="ts">
import { computed } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useAuth } from '@/composables/useAuth'
import { usePasswordRecoverySession } from '@/composables/usePasswordRecoverySession.js'
import { useFormSubmission } from '@/composables/useFormSubmission.js'
import { changePasswordSchema } from '@/validators/auth'
import { Button } from '@/components/ui/button'
import FormField from '@/components/ui/FormField.vue'
import FormStatus from '@/components/ui/FormStatus.vue'
import { getAuthErrorMessage } from '@/lib/authErrors.js'

const { changePassword } = useAuth()
const session = usePasswordRecoverySession()

const { handleSubmit } = useForm({
  validationSchema: toTypedSchema(changePasswordSchema),
})

const submission = useFormSubmission({
  onSubmit: async (data: { newPassword: string; confirmNewPassword: string }) => {
    if (!session.isReady()) {
      throw new Error('Sesja resetowania hasła nie jest aktywna.')
    }
    await changePassword(data.newPassword)
  },
  onSuccess: () => {
    submission.message.value = 'Hasło zostało zaktualizowane. Możesz się teraz zalogować.'
  },
  onError: (error) => {
    submission.message.value = getAuthErrorMessage(error)
  },
  processingMessage: 'Aktualizujemy Twoje hasło...',
})

const isFormDisabled = computed(
  () => !session.isReady() || submission.isProcessing.value,
)

const showSessionStatus = computed(() => {
  return session.isChecking() || session.isInvalid()
})

const sessionStatusMessage = computed(() => {
  if (session.isChecking()) {
    return 'Trwa weryfikacja linku resetującego...'
  }
  if (session.isInvalid()) {
    return session.errorMessage.value
  }
  return ''
})

const sessionStatusVariant = computed<'info' | 'success' | 'error'>(() => {
  if (session.isInvalid()) {
    return 'error'
  }
  return 'info'
})

const onSubmit = handleSubmit(async (values) => {
  await submission.execute(values)
})
</script>

<template>
  <form class="flex flex-col gap-6" @submit="onSubmit" novalidate>
    <FormStatus
      v-if="showSessionStatus"
      :message="sessionStatusMessage"
      :variant="sessionStatusVariant"
    />

    <div v-if="session.isInvalid()" class="text-sm text-muted-foreground">
      <p class="mb-2">
        Jeśli potrzebujesz nowego linku resetującego, przejdź ponownie przez proces odzyskiwania
        konta.
      </p>
      <a href="/auth/recover" class="font-semibold text-primary underline-offset-2 hover:underline">
        Wróć do formularza odzyskiwania
      </a>
    </div>

    <div v-else-if="session.isReady()">
      <FormField
        name="newPassword"
        label="Nowe hasło"
        type="password"
        autocomplete="new-password"
        :disabled="isFormDisabled"
      />

      <div class="mt-4">
        <FormField
          name="confirmNewPassword"
          label="Potwierdź nowe hasło"
          type="password"
          autocomplete="new-password"
          :disabled="isFormDisabled"
        />
      </div>
    </div>

    <FormStatus
      v-if="submission.message.value"
      :message="submission.message.value"
      :variant="submission.variant.value"
    />

    <Button type="submit" :disabled="isFormDisabled">
      <span v-if="submission.isProcessing.value">Aktualizujemy hasło...</span>
      <span v-else-if="submission.isSuccess.value">Hasło zaktualizowane</span>
      <span v-else>Ustaw nowe hasło</span>
    </Button>

    <p v-if="submission.isSuccess.value" class="text-sm text-muted-foreground">
      Możesz teraz przejść do
      <a href="/auth/login" class="font-semibold text-primary underline-offset-2 hover:underline">
        strony logowania
      </a>
      i zalogować się nowym hasłem.
    </p>
  </form>
</template>
