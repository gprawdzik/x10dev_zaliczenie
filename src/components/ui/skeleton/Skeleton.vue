<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

import { cn } from '@/lib/utils';

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class'];
  }>(),
  {
    class: undefined,
  }
);
</script>

<template>
  <div
    role="status"
    aria-live="polite"
    :class="cn('animate-pulse rounded-md bg-muted/50', props.class)"
  >
    <slot />
  </div>
</template>

