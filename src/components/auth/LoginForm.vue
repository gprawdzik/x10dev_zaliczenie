<script setup lang="ts">
import { computed } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { loginSchema } from '@/validators/auth'
import { Button } from '@/components/ui/button'
import FormField from '@/components/ui/FormField.vue'
import FormStatus from '@/components/ui/FormStatus.vue'
import { useAuth } from '@/composables/useAuth'
import { useFormSubmission } from '@/composables/useFormSubmission.js'
import { useNavigation } from '@/composables/useNavigation.js'
import { getAuthErrorMessage } from '@/lib/authErrors.js'

interface Props {
  redirectTarget?: string | null
  flashMessage?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  redirectTarget: null,
  flashMessage: null,
})

const { signIn } = useAuth()
const { navigate } = useNavigation()

const redirectDestination = computed(() => props.redirectTarget ?? '/')
const flashMessage = computed(() => props.flashMessage?.trim() ?? '')

const redirectInfo = computed(() => {
  if (!props.redirectTarget) {
    return ''
  }
  return `Po zalogowaniu wrócisz automatycznie do „${props.redirectTarget}".`
})

const { handleSubmit } = useForm({
  validationSchema: toTypedSchema(loginSchema),
})

const submission = useFormSubmission({
  onSubmit: async (data: { email: string; password: string }) => {
    await signIn(data.email, data.password)
  },
  onSuccess: () => {
    navigate(redirectDestination.value)
  },
  onError: (error) => {
    submission.message.value = getAuthErrorMessage(error)
  },
  successMessage: 'Zalogowano pomyślnie! Przekierowujemy do panelu...',
  processingMessage: 'Logujemy Cię...',
})

const onSubmit = handleSubmit(async (values) => {
  await submission.execute(values)
})
</script>

<template>
  <form
    class="flex flex-col gap-6"
    @submit="onSubmit"
    novalidate
    data-testid="login-form"
  >
    <div
      v-if="flashMessage"
      class="rounded-md border border-border bg-muted/40 p-3 text-sm text-foreground"
      role="status"
      aria-live="polite"
    >
      {{ flashMessage }}
    </div>

    <div v-if="redirectInfo" class="rounded-md border border-dashed border-border bg-muted/40 p-3 text-sm">
      {{ redirectInfo }}
    </div>

    <FormField
      name="email"
      label="Adres email"
      type="email"
      placeholder="jan.kowalski@example.com"
      autocomplete="email"
      :disabled="submission.isProcessing.value"
      data-testid="login-email-input"
    />

    <FormField
      name="password"
      label="Hasło"
      type="password"
      placeholder="••••••••••"
      autocomplete="current-password"
      :disabled="submission.isProcessing.value"
      data-testid="login-password-input"
    />

    <FormStatus
      v-if="submission.message.value"
      :message="submission.message.value"
      :variant="submission.variant.value"
      data-testid="login-status"
    />

    <Button
      type="submit"
      :disabled="submission.isProcessing.value"
      data-testid="login-submit-button"
    >
      <span v-if="submission.isProcessing.value">Trwa logowanie...</span>
      <span v-else>Zaloguj się</span>
    </Button>
  </form>
</template>
