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
  <th
    scope="col"
    :class="
      cn(
        'h-11 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground [&:has([role=checkbox])]:pr-0',
        props.class
      )
    "
  >
    <slot />
  </th>
</template>

