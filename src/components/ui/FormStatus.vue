<script setup lang="ts">
import { computed } from 'vue'

type StatusVariant = 'info' | 'success' | 'error'

interface Props {
  message: string
  variant?: StatusVariant
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'info',
})

const statusClasses = computed(() => {
  if (props.variant === 'success') {
    return 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/50 dark:bg-emerald-950/40 dark:text-emerald-100'
  }

  if (props.variant === 'error') {
    return 'border-destructive/50 bg-destructive/10 text-destructive'
  }

  return 'border-border bg-muted/30 text-muted-foreground'
})
</script>

<template>
  <div
    class="rounded-md border p-3 text-sm"
    :class="statusClasses"
    role="status"
    aria-live="polite"
  >
    {{ message }}
  </div>
</template>

