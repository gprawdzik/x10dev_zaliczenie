import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import type { ProgressAnnualResponse } from '../types.js';
import type { ProgressChartVM, ProgressFilterState, ProgressSeriesVM, ProgressViewState } from '../lib/view-models/progress.js';

const currentYear = new Date().getFullYear();

const DEFAULT_FILTERS: ProgressFilterState = {
  year: currentYear,
  metric_type: 'distance',
  sport_id: null,
};

const defaultState: ProgressViewState = {
  chart: undefined,
  loading: false,
  error: null,
};

export const useProgressStore = defineStore('progress', () => {
  const filters = ref<ProgressFilterState>({ ...DEFAULT_FILTERS });
  const state = ref<ProgressViewState>({ ...defaultState });
  const cache = ref<Map<string, ProgressChartVM>>(new Map());

  const cacheKey = computed(() => buildCacheKey(filters.value));
  const chart = computed(() => state.value.chart);

  function setFilters(next: Partial<ProgressFilterState>) {
    filters.value = { ...filters.value, ...next };
  }

  async function loadProgress(force = false) {
    if (typeof window === 'undefined') {
      // Avoid fetching during SSR; will run on client after hydration
      return;
    }

    state.value.loading = true;
    state.value.error = null;

    const key = cacheKey.value;
    if (!force && cache.value.has(key)) {
      const cached = cache.value.get(key);
      if (cached) {
        applyChartState(cached);
        state.value.error = null;
        state.value.loading = false;
        return;
      }
    }

    try {
      const response = await fetch('/api/progress-annual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(filters.value),
      });

      if (!response.ok) {
        const errorPayload = await safeParseJson(response);
        const message =
          errorPayload?.error?.message ??
          'Nie udało się pobrać danych postępu. Spróbuj ponownie.';
        throw new Error(message);
      }

      const payload = (await response.json()) as ProgressAnnualResponse;
      const chartVm = mapResponseToChartVM(payload);
      cache.value.set(key, chartVm);
      applyChartState(chartVm);
    } catch (error) {
      console.error('Failed to load progress', error);
      state.value.error =
        error instanceof Error
          ? error.message
          : 'Nie udało się pobrać danych postępu. Spróbuj ponownie.';
      state.value.chart = undefined;
    } finally {
      state.value.loading = false;
    }
  }

  function applyChartState(chartVm: ProgressChartVM) {
    state.value.chart = chartVm;
    state.value.error = null;
  }

  function retry() {
    return loadProgress(true);
  }

  return {
    filters,
    state,
    chart,
    setFilters,
    loadProgress,
    retry,
  };
});

function buildCacheKey(filters: ProgressFilterState): string {
  return `${filters.year}-${filters.metric_type}-${filters.sport_id ?? 'all'}`;
}

function mapResponseToChartVM(response: ProgressAnnualResponse): ProgressChartVM {
  const normalize = (value: number | null | undefined) =>
    normalizeMetricValue(response.metric_type, value);

  const series = response.series.map<ProgressSeriesVM>((item) => ({
    date: item.date,
    value: normalize(item.value),
    label: new Date(item.date).toLocaleDateString('pl-PL', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  const achieved = series.at(-1)?.value ?? 0;
  const targetValue = normalize(response.target_value ?? 0);
  const percent = targetValue ? Math.min((achieved / targetValue) * 100, 999) : 0;

  return {
    series,
    targetValue,
    achieved,
    percent,
    metric: response.metric_type,
    year: response.year,
    scope: response.scope_type,
  };
}

function normalizeMetricValue(
  metric: ProgressFilterState['metric_type'],
  value: number | null | undefined
): number {
  if (!Number.isFinite(value ?? 0)) {
    return 0;
  }

  if (metric === 'distance') {
    return (value ?? 0) / 1000;
  }

  return value ?? 0;
}

async function safeParseJson(response: Response): Promise<{ error?: { message?: string } } | null> {
  try {
    return (await response.json()) as { error?: { message?: string } };
  } catch {
    return null;
  }
}
