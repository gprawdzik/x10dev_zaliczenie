<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';

import ProgressChart from './ProgressChart.vue';
import ProgressFilters from './ProgressFilters.vue';
import type { ProgressFilterState } from '@/lib/view-models/progress.js';
import { useSports } from '@/composables/useSports.js';
import { useToastStore } from '@/stores/toast.js';
import { useProgressStore } from '@/stores/useProgressStore.js';

interface Props {
  initialFilters: ProgressFilterState;
  years: number[];
}

const props = defineProps<Props>();

const progressStore = useProgressStore();
const toastStore = useToastStore();
const { sports, isLoading: sportsLoading, fetchSports, error: sportsError } = useSports();

const { filters, state, chart } = storeToRefs(progressStore);

const currentFilters = computed(() => filters?.value ?? props.initialFilters);
const currentChart = computed(() => chart?.value);
const sportsOptions = computed(() =>
  (sports?.value ?? []).map((sport) => ({
    value: sport.id,
    label: sport.name ?? sport.code ?? 'Sport',
  }))
);

const sportsMap = computed<Record<string, { name?: string; code?: string }>>(() => {
  const map: Record<string, { name?: string; code?: string }> = {};
  (sports?.value ?? []).forEach((sport) => {
    map[sport.id] = { name: sport.name, code: sport.code };
  });
  return map;
});

const currentScopeLabel = computed(() =>
  currentFilters.value.sport_id
    ? sportsMap.value[currentFilters.value.sport_id]?.name ?? 'Cel dla sportu'
    : 'Cel globalny'
);

onMounted(() => {
  progressStore.setFilters(props.initialFilters);
  void fetchSports();
  void loadProgress(true);
});

watch(
  () => state.value.error,
  (error) => {
    if (error) {
      toastStore.error('Nie udało się pobrać postępów', error);
    }
  }
);

watch(
  () => props.initialFilters,
  (next) => {
    progressStore.setFilters(next);
    void loadProgress(true);
  },
  { deep: true }
);

function handleFiltersChange(next: ProgressFilterState) {
  progressStore.setFilters(next);
  void loadProgress(true);
}

function handleRetry() {
  void progressStore.retry();
}

async function loadProgress(force = false) {
  await progressStore.loadProgress(force);
}
</script>

<template>
  <div class="panel">
    <ProgressFilters
      :model-value="currentFilters"
      :years="years"
      :loading="state.loading"
      :sports="sportsOptions"
      :sports-loading="sportsLoading"
      @update:modelValue="handleFiltersChange"
    />
    <p v-if="sportsError" class="sports-error">
      Nie udało się załadować sportów: {{ sportsError }}
    </p>

    <ProgressChart
      :series="currentChart?.series ?? []"
      :metric-type="currentFilters.metric_type"
      :year="currentFilters.year"
      :loading="state.loading"
      :error="state.error"
      :target-value="currentChart?.targetValue ?? 0"
      :percent="currentChart?.percent ?? 0"
      :scope-label="currentScopeLabel"
      :show-stats="false"
      @retry="handleRetry"
    />
  </div>
</template>

<style scoped>
@reference "../../../assets/base.css";

.panel {
  @apply space-y-6;
}

.sports-error {
  @apply text-sm text-destructive;
}
</style>
