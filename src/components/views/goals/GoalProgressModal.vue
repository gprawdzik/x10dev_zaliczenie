<script setup lang="ts">
import ProgressChart from '../progress/ProgressChart.vue';
import { Button } from '@/components/ui/button/index.js';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog/index.js';
import type { GoalDto } from '@/types.js';
import type { ProgressChartVM } from '@/lib/view-models/progress.js';

interface Props {
  open: boolean;
  goal: GoalDto | null;
  chart: ProgressChartVM | null;
  sportName?: string | null;
  loading?: boolean;
  error?: string | null;
  year: number;
  maxYear: number;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  sportName: null,
  year: new Date().getFullYear(),
  maxYear: new Date().getFullYear(),
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'retry'): void;
  (e: 'change-year', value: number): void;
}>();

const currentYear = new Date().getFullYear();

function getTitle(goal: GoalDto | null, sportName?: string | null): string {
  if (!goal) return 'Postęp celu';
  if (goal.scope_type === 'global') return 'Postęp celu globalnego';
  return sportName ? `Postęp celu: ${sportName}` : 'Postęp celu dla sportu';
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('close')">
    <DialogContent class="progress-dialog">
      <DialogHeader>
        <div class="header-row">
          <DialogTitle>{{ getTitle(goal, sportName) }}</DialogTitle>
          <div class="year-nav">
            <Button
              variant="ghost"
              size="icon"
              class="year-btn"
              @click="emit('change-year', props.year - 1)"
            >
              ‹
            </Button>
            <span class="year-label">{{ props.year }}</span>
            <Button
              variant="ghost"
              size="icon"
              class="year-btn"
              :disabled="props.year >= props.maxYear"
              @click="emit('change-year', props.year + 1)"
            >
              ›
            </Button>
          </div>
        </div>
      </DialogHeader>

      <div v-if="loading" class="dialog-body">
        <ProgressChart
          :series="[]"
          :metric-type="goal?.metric_type ?? 'distance'"
          :year="currentYear"
          loading
        />
      </div>

      <div v-else-if="error" class="dialog-body error">
        <p class="error-title">Nie udało się pobrać postępu</p>
        <p class="error-text">{{ error }}</p>
        <Button variant="outline" size="sm" @click="emit('retry')">Spróbuj ponownie</Button>
      </div>

      <div v-else class="dialog-body">
        <ProgressChart
          v-if="chart"
          :series="chart.series"
          :metric-type="chart.metric"
          :year="chart.year"
          :target-value="chart.targetValue"
          :percent="chart.percent"
          :scope-label="chart.scope === 'global' ? 'Cel globalny' : sportName ?? 'Cel dla sportu'"
          :show-value-badge="true"
          :show-ideal-line="true"
        />
        <p v-else class="empty-text">Brak danych postępu dla tego celu.</p>
      </div>

      <DialogFooter class="dialog-footer">
        <Button variant="outline" @click="emit('close')">Zamknij</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
@reference "../../../assets/base.css";

.progress-dialog {
  @apply max-w-3xl;
}

.dialog-body {
  @apply space-y-3;
}

.dialog-footer {
  @apply mt-4;
}

.header-row {
  @apply flex items-center justify-between gap-3;
}

.year-nav {
  @apply inline-flex items-center gap-2;
}

.year-btn {
  @apply h-8 w-8 p-0;
}

.year-label {
  @apply text-sm font-medium;
}

.error {
  @apply rounded-lg border border-destructive/40 bg-destructive/5 p-4;
}

.error-title {
  @apply text-sm font-semibold text-destructive;
}

.error-text {
  @apply text-sm text-muted-foreground;
}

.empty-text {
  @apply text-sm text-muted-foreground;
}
</style>


