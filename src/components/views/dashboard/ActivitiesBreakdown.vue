<script setup lang="ts">
import { computed } from 'vue';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card/index.js';
import SkeletonRow from './SkeletonRow.vue';
import type { BreakdownItem } from '@/composables/useDashboardData.js';

const props = withDefaults(
  defineProps<{
    title: string;
    items: BreakdownItem[];
    isLoading?: boolean;
    emptyLabel?: string;
  }>(),
  {
    items: () => [],
    isLoading: false,
    emptyLabel: 'Brak danych',
  }
);

const hasItems = computed(() => (props.items?.length ?? 0) > 0);
</script>

<template>
  <Card class="h-full">
    <CardHeader>
      <CardTitle class="text-lg font-semibold text-foreground">
        {{ title }}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <SkeletonRow v-if="props.isLoading" variant="list" :rows="4" />
      <div v-else-if="!hasItems" class="space-y-2 text-sm text-muted-foreground">
        <p>{{ emptyLabel }}</p>
        <a href="/settings" class="inline-flex items-center gap-1 text-primary hover:underline">
          Wygeneruj przykładowe aktywności w Ustawieniach →
        </a>
      </div>
      <ul v-else class="flex flex-col gap-4 lg:gap-5">
        <li
          v-for="item in props.items"
          :key="item.sport"
          class="flex items-center justify-between rounded-xl border border-border/80 bg-card px-4 py-3 md:px-4 md:py-3 shadow-md"
        >
          <span class="font-medium text-foreground">
            {{ item.sport }}
          </span>
          <span class="text-sm text-muted-foreground">
            {{ item.count }} aktywności
          </span>
        </li>
      </ul>
    </CardContent>
  </Card>
</template>

