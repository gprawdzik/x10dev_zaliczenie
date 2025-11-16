<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

import { cn } from '@/lib/utils';

const props = withDefaults(
  defineProps<{
    modelValue: string | number | null;
    disabled?: boolean;
    placeholder?: string;
    class?: HTMLAttributes['class'];
  }>(),
  {
    disabled: false,
    placeholder: undefined,
    class: undefined,
  }
);

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void;
}>();

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement | null;
  if (!target) {
    return;
  }
  emit('update:modelValue', target.value);
};
</script>

<template>
  <select
    :class="
      cn(
        'h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60',
        props.class
      )
    "
    :disabled="props.disabled"
    :value="props.modelValue ?? ''"
    @change="handleChange"
  >
    <option
      v-if="props.placeholder"
      value=""
      disabled
      :selected="!props.modelValue"
      class="text-muted-foreground"
    >
      {{ props.placeholder }}
    </option>
    <slot />
  </select>
</template>

