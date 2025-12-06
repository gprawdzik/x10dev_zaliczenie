<script setup lang="ts">
import { computed } from 'vue';

import SkeletonRow from './SkeletonRow.vue';
import type { ProgressMetricType } from '@/lib/view-models/progress.js';

type ComparisonPoint = { label: string; target: number; actual: number };

const props = withDefaults(
  defineProps<{
    data: ComparisonPoint[];
    metricType: ProgressMetricType;
    loading?: boolean;
  }>(),
  {
    data: () => [],
    loading: false,
  }
);

const hasData = computed(
  () => props.data.some((item) => (item.target ?? 0) > 0 || (item.actual ?? 0) > 0) ?? false
);
const maxValue = computed(() => {
  const values = props.data.flatMap((item) => [item.target ?? 0, item.actual ?? 0]);
  const max = Math.max(...values, 0);
  return max > 0 ? max : 1;
});

const normalizedRows = computed(() =>
  props.data.map((item) => {
    const denominator = maxValue.value || 1;
    const targetPct = Math.min((item.target / denominator) * 100, 100);
    const actualPct = Math.min((item.actual / denominator) * 100, 100);
    return {
      ...item,
      targetPct,
      actualPct,
    };
  })
);

function formatValue(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '0';

  switch (props.metricType) {
    case 'distance':
      return value >= 10 ? `${value.toFixed(0)} km` : `${value.toFixed(1)} km`;
    case 'time': {
      const hours = value / 3600;
      if (hours >= 1) return `${hours.toFixed(1)} h`;
      return `${Math.round(value / 60)} min`;
    }
    case 'elevation_gain':
      return value >= 1000 ? `${(value / 1000).toFixed(1)} km` : `${Math.round(value)} m`;
    default:
      return String(value);
  }
}
</script>

<template>
  <div class="card">
    <div class="card-header">
      <div>
        <p class="eyebrow">Porównanie celu</p>
        <p class="title">Cel vs wykonanie</p>
      </div>
    </div>

    <div v-if="loading" class="body">
      <SkeletonRow variant="chart" />
    </div>

    <div v-else-if="!hasData" class="body empty">
      <p class="empty-title">Brak danych porównawczych</p>
      <p class="empty-text">Dodaj cel lub wybierz inny filtr, aby zobaczyć porównanie.</p>
    </div>

    <div v-else class="body space-y-4">
      <div v-for="row in normalizedRows" :key="row.label" class="row">
        <div class="row-header">
          <span class="row-label">{{ row.label }}</span>
          <span class="row-values">{{ formatValue(row.actual) }} / {{ formatValue(row.target) }}</span>
        </div>
        <div class="bars">
          <div class="bar target" :style="{ width: `${row.targetPct}%` }" />
          <div class="bar actual" :style="{ width: `${row.actualPct}%` }" />
        </div>
        <div class="legend">
          <span class="badge target">Cel</span>
          <span class="badge actual">Wykonanie</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "../../../assets/base.css";

.card {
  @apply rounded-xl border border-border bg-card/50 p-4 shadow-sm;
}

.card-header {
  @apply flex items-center justify-between;
}

.eyebrow {
  @apply text-xs uppercase tracking-wide text-muted-foreground;
}

.title {
  @apply text-lg font-semibold text-foreground;
}

.body {
  @apply mt-4;
}

.row {
  @apply space-y-2;
}

.row-header {
  @apply flex items-center justify-between text-sm;
}

.row-label {
  @apply font-medium text-foreground;
}

.row-values {
  @apply text-muted-foreground;
}

.bars {
  @apply relative h-3 overflow-hidden rounded-full bg-muted;
}

.bar {
  @apply absolute left-0 top-0 h-full rounded-full transition-all;
}

.bar.target {
  @apply bg-primary/30;
}

.bar.actual {
  @apply bg-primary;
}

.legend {
  @apply flex gap-2 text-xs text-muted-foreground;
}

.badge {
  @apply inline-flex items-center gap-1 rounded-full px-2 py-1;
}

.badge.target {
  @apply bg-primary/15 text-foreground;
}

.badge.actual {
  @apply bg-primary/25 text-foreground;
}

.empty {
  @apply flex flex-col gap-2 rounded-lg border border-dashed border-border p-4;
}

.empty-title {
  @apply text-base font-semibold;
}

.empty-text {
  @apply text-sm text-muted-foreground;
}
</style>


