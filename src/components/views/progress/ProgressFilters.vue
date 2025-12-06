<script setup lang="ts">
import type { ProgressFilterState } from '@/lib/view-models/progress.js';

interface SelectOption {
  value: string | null;
  label: string;
}

interface Props {
  modelValue: ProgressFilterState;
  years: number[];
  loading?: boolean;
  sports?: SelectOption[];
  sportsLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  sports: () => [],
  sportsLoading: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: ProgressFilterState): void;
}>();

const metricOptions: SelectOption[] = [
  { value: 'distance', label: 'Dystans' },
  { value: 'time', label: 'Czas' },
  { value: 'elevation_gain', label: 'Przewyższenie' },
];

function updateFilters(partial: Partial<ProgressFilterState>) {
  emit('update:modelValue', { ...props.modelValue, ...partial });
}
</script>

<template>
  <div class="filters-card">
    <div class="filters-grid">
      <label class="filter-field">
        <span class="field-label">Rok</span>
        <select
          class="field-control"
          :value="modelValue.year"
          :disabled="loading"
          @change="updateFilters({ year: Number(($event.target as HTMLSelectElement).value) })"
        >
          <option v-for="year in years" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
      </label>

      <label class="filter-field">
        <span class="field-label">Metryka</span>
        <select
          class="field-control"
          :value="modelValue.metric_type"
          :disabled="loading"
          @change="updateFilters({ metric_type: ($event.target as HTMLSelectElement).value as ProgressFilterState['metric_type'] })"
        >
          <option v-for="option in metricOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>

      <label class="filter-field">
        <span class="field-label">Sport</span>
        <select
          class="field-control"
          :value="modelValue.sport_id ?? ''"
          :disabled="loading || sportsLoading"
          @change="updateFilters({ sport_id: ($event.target as HTMLSelectElement).value || null })"
        >
          <option v-for="option in [{ value: null, label: 'Wszystkie sporty' }, ...sports]" :key="option.value ?? 'all'" :value="option.value ?? ''">
            {{ option.label }}
          </option>
        </select>
      </label>
    </div>
  </div>
  <p v-if="sportsLoading" class="loading-hint">Ładowanie listy sportów...</p>
</template>

<style scoped>
@reference "../../../assets/base.css";

.filters-card {
  @apply rounded-xl border border-border bg-card/50 p-4 shadow-sm;
}

.filters-grid {
  @apply grid gap-4 md:grid-cols-3;
}

.filter-field {
  @apply flex flex-col gap-2;
}

.field-label {
  @apply text-sm font-medium text-muted-foreground;
}

.field-control {
  @apply w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none;
}

.loading-hint {
  @apply mt-2 text-sm text-muted-foreground;
}
</style>

