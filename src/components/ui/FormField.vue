<script setup lang="ts">
import { useField } from 'vee-validate'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  name: string
  label: string
  type?: string
  placeholder?: string
  autocomplete?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
})

const { value, errorMessage } = useField(() => props.name)
</script>

<template>
  <div class="flex flex-col gap-2">
    <Label :for="name">{{ label }}</Label>
    <Input
      :id="name"
      v-model="value"
      :type="type"
      :name="name"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :aria-invalid="!!errorMessage"
      :disabled="disabled"
    />
    <p v-if="errorMessage" class="text-sm text-destructive" aria-live="polite">
      {{ errorMessage }}
    </p>
  </div>
</template>

