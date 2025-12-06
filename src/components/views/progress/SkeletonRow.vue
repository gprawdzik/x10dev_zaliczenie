<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    rows?: number;
    variant?: 'chart' | 'card';
  }>(),
  {
    rows: 3,
    variant: 'card',
  }
);

const placeholders = computed(() => Array.from({ length: props.rows }, (_, index) => index));
</script>

<template>
  <div v-if="variant === 'chart'" class="space-y-3">
    <div class="h-6 w-28 animate-pulse rounded-md bg-muted" />
    <div class="h-64 animate-pulse rounded-lg bg-muted" />
  </div>
  <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    <div v-for="item in placeholders" :key="item" class="animate-pulse rounded-xl border border-border bg-muted/30 p-4">
      <div class="mb-4 h-4 w-24 rounded bg-muted" />
      <div class="mb-2 h-6 w-32 rounded bg-muted" />
      <div class="h-3 w-full rounded bg-muted" />
    </div>
  </div>
</template>

