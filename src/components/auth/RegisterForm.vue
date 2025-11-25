<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { registerSchema } from '@/validators/auth'
import { Button } from '@/components/ui/button'
import FormField from '@/components/ui/FormField.vue'
import FormStatus from '@/components/ui/FormStatus.vue'
import { useAuth } from '@/composables/useAuth'
import { useFormSubmission } from '@/composables/useFormSubmission.js'
import { useNavigation } from '@/composables/useNavigation.js'
import { getAuthErrorMessage } from '@/lib/authErrors.js'

const passwordHints = [
  'Minimum 10 znaków',
  'Przynajmniej jedna wielka litera',
  'Przynajmniej jedna mała litera',
  'Przynajmniej jedna cyfra',
]

const { signUp } = useAuth()
const { navigateDelayed } = useNavigation()

const { handleSubmit } = useForm({
  validationSchema: toTypedSchema(registerSchema),
})

const submission = useFormSubmission({
  onSubmit: async (data: { email: string; password: string; confirmPassword: string }) => {
    return await signUp(data.email, data.password)
  },
  onSuccess: (result) => {
    if (!result.session) {
      submission.message.value =
        'Konto utworzono. Potwierdź adres email, aby dokończyć rejestrację.'
      return
    }

    submission.message.value = 'Konto utworzone! Przekierowujemy do pulpitu...'
    navigateDelayed('/', 900)
  },
  onError: (error) => {
    submission.message.value = getAuthErrorMessage(error)
  },
  processingMessage: 'Tworzymy konto...',
})

const onSubmit = handleSubmit(async (values) => {
  await submission.execute(values)
})
</script>

<template>
  <form class="flex flex-col gap-6" @submit="onSubmit" novalidate>
    <FormField
      name="email"
      label="Adres email"
      type="email"
      placeholder="jan.kowalski@example.com"
      autocomplete="email"
      :disabled="submission.isProcessing.value"
    />

    <div class="flex flex-col gap-2">
      <FormField
        name="password"
        label="Hasło"
        type="password"
        placeholder="Silne hasło"
        autocomplete="new-password"
        :disabled="submission.isProcessing.value"
      />
      <ul class="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        <li v-for="hint in passwordHints" :key="hint">{{ hint }}</li>
      </ul>
    </div>

    <FormField
      name="confirmPassword"
      label="Potwierdź hasło"
      type="password"
      placeholder="Powtórz hasło"
      autocomplete="new-password"
      :disabled="submission.isProcessing.value"
    />

    <FormStatus
      v-if="submission.message.value"
      :message="submission.message.value"
      :variant="submission.variant.value"
    />

    <Button type="submit" :disabled="submission.isProcessing.value">
      <span v-if="submission.isProcessing.value">Tworzymy konto...</span>
      <span v-else>Załóż konto</span>
    </Button>
  </form>
</template>
