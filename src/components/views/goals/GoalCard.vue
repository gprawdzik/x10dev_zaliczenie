<template>
  <Card class="goal-card">
    <CardHeader class="goal-header">
      <div class="goal-title-section">
        <div class="goal-icon">
          <span v-if="scopeType === 'global'">🎯</span>
          <span v-else-if="sportName">🏃</span>
          <span v-else>⚽</span>
        </div>
        <div class="goal-meta">
          <CardTitle class="goal-title">
            {{ scopeType === 'global' ? 'Globalny' : sportName || 'Nieznany sport' }}
          </CardTitle>
        </div>
      </div>
    </CardHeader>

    <CardContent class="goal-content">
      <div class="goal-metric">
        <p class="metric-label">{{ getMetricLabel(goal.metric_type) }}</p>
        <p class="metric-value">{{ formatTargetValue(goal.metric_type, goal.target_value) }}</p>
      </div>

      <div class="goal-progress">
        <div class="progress-label">
          <span>Postęp</span>
          <span class="progress-percentage">
            {{
              displayPercent !== null
                ? `${displayPercent.toFixed(displayPercent >= 100 ? 0 : 1)}%`
                : '—'
            }}
          </span>
        </div>
        <div class="progress-shell">
          <div class="progress-fill" :style="{ width: `${barPercent}%` }" />
        </div>
      </div>
    </CardContent>

    <CardFooter class="goal-footer">
      <div class="footer-actions">
        <Button variant="outline" size="sm" @click="$emit('progress', goal)">Pokaż postęp</Button>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="sm" class="action-button">
              <span class="sr-only">Otwórz menu akcji</span>
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.12132 8.625 12.5 8.625C11.87868 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.87868 6.375 12.5 6.375C13.12132 6.375 13.625 6.87868 13.625 7.5Z"
                  fill="currentColor"
                />
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem @click="$emit('edit', goal)"> Edytuj </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="$emit('delete', goal)" class="text-destructive">
              Usuń
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { Button } from '@/components/ui/button/index.js'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card/index.js'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu/index.js'

import type { GoalDto } from '../../../types.js'

interface Props {
  goal: GoalDto
  sportName?: string
  progressValue?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  progressValue: null,
})

defineEmits<{
  edit: [goal: GoalDto]
  delete: [goal: GoalDto]
  progress: [goal: GoalDto]
}>()

const scopeType = computed(() => props.goal.scope_type)
const displayPercent = computed(() => {
  if (!Number.isFinite(props.progressValue ?? NaN)) return null
  return Math.max(0, Math.min(props.progressValue ?? 0, 999))
})
const barPercent = computed(() => {
  if (displayPercent.value === null) return 0
  return Math.min(displayPercent.value, 100)
})

function getMetricLabel(metricType: string): string {
  switch (metricType) {
    case 'distance':
      return 'Dystans'
    case 'time':
      return 'Czas'
    case 'elevation_gain':
      return 'Przewyższenie'
    default:
      return 'Nieznana metryka'
  }
}

function formatTargetValue(metricType: string, value: number): string {
  // Handle edge cases for invalid values
  if (!value || value < 0 || !isFinite(value)) {
    return '0'
  }

  switch (metricType) {
    case 'distance':
    case 'elevation_gain': {
      const kmValue = value / 1000
      // Display as integer if whole number, otherwise with one decimal place
      return Number.isInteger(kmValue) ? `${kmValue} km` : `${kmValue.toFixed(1)} km`
    }
    case 'time':
      return `${value} h`
    default:
      return String(value)
  }
}
</script>

<style scoped>
@reference "../../../assets/base.css";

.goal-card {
  @apply h-full transition-shadow hover:shadow-md;
}

.goal-header {
  @apply pb-2;
}

.goal-title-section {
  @apply flex items-center gap-3;
}

.goal-icon {
  @apply flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg;
}

.goal-meta {
  @apply flex-1;
}

.goal-title {
  @apply text-base font-semibold;
}


.goal-content {
  @apply space-y-4;
}

.goal-metric {
  @apply text-center;
}

.metric-label {
  @apply text-sm font-medium text-muted-foreground;
}

.metric-value {
  @apply text-2xl font-bold;
}

.goal-progress {
  @apply space-y-2;
}

.progress-label {
  @apply flex justify-between text-sm;
}

.progress-percentage {
  @apply font-medium;
}

.progress-shell {
  @apply h-2 w-full overflow-hidden rounded-full bg-muted;
}

.progress-fill {
  @apply h-full bg-primary transition-all;
}

.goal-footer {
  @apply pt-2;
}

.footer-actions {
  @apply flex w-full items-center justify-between gap-2;
}

.action-button {
  @apply h-8 w-8 p-0;
}
</style>
