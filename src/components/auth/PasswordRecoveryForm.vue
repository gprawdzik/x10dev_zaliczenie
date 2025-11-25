<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { passwordRecoverySchema } from '@/validators/auth'
import { Button } from '@/components/ui/button'
import FormField from '@/components/ui/FormField.vue'
import FormStatus from '@/components/ui/FormStatus.vue'
import { useFormSubmission } from '@/composables/useFormSubmission.js'
import { authApi } from '@/services/authApi.js'

const { handleSubmit, resetForm } = useForm({
  validationSchema: toTypedSchema(passwordRecoverySchema),
})

const submission = useFormSubmission({
  onSubmit: async (data: { email: string }) => {
    return await authApi.requestPasswordRecovery(data.email)
  },
  onSuccess: (result) => {
    submission.message.value = result.message
    resetForm()
  },
  processingMessage: 'Wysyłamy instrukcje...',
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

    <FormStatus
      v-if="submission.message.value"
      :message="submission.message.value"
      :variant="submission.variant.value"
    />

    <Button type="submit" :disabled="submission.isProcessing.value">
      <span v-if="submission.isProcessing.value">Wysyłamy instrukcje...</span>
      <span v-else>Wyślij link resetujący</span>
    </Button>
  </form>
</template>
