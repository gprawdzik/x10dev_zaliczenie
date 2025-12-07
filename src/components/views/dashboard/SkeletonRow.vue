<script setup lang="ts">
import { computed } from 'vue';

import { Skeleton } from '@/components/ui/skeleton/index.js';

const props = withDefaults(
  defineProps<{
    rows?: number;
    variant?: 'list';
  }>(),
  {
    rows: 4,
    variant: 'list',
  }
);

const placeholders = computed(() => Array.from({ length: props.rows }, (_, index) => index));
</script>

<template>
  <div v-if="variant === 'list'" class="space-y-3">
    <div
      v-for="item in placeholders"
      :key="item"
      class="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3"
    >
      <div class="space-y-2">
        <Skeleton class="h-3 w-28" />
        <Skeleton class="h-3 w-16" />
      </div>
      <Skeleton class="h-4 w-14" />
    </div>
  </div>
</template>

