<script setup lang="ts">
import { computed } from 'vue';

import { Button } from '@/components/ui/button/index.js';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card/index.js';
import { Progress } from '@/components/ui/progress/index.js';
import type { GoalCardVM } from '@/lib/view-models/progress.js';

interface Props {
  goal: GoalCardVM;
}

const props = defineProps<Props>();

const percentValue = computed(() => Math.min(Math.max(props.goal.percent, 0), 999));
const barValue = computed(() => Math.min(percentValue.value, 100));
</script>

<template>
  <Card class="goal-card">
    <CardHeader>
      <CardTitle class="goal-title">
        {{ goal.title }}
        <span class="goal-scope">{{ goal.scopeLabel }}</span>
      </CardTitle>
    </CardHeader>

    <CardContent class="goal-content">
      <div class="goal-row">
        <p class="label">Metryka</p>
        <p class="value">{{ goal.metricLabel }}</p>
      </div>

      <div class="goal-row">
        <p class="label">Cel</p>
        <p class="value">{{ goal.targetValue }}</p>
      </div>

      <div class="goal-row">
        <p class="label">Wykonanie</p>
        <p class="value">{{ goal.achievedValue }}</p>
      </div>

      <div class="progress-block">
        <div class="progress-header">
          <span>Postęp</span>
          <span class="percent">{{ percentValue }}%</span>
        </div>
        <Progress :model-value="barValue" class="progress-bar" />
      </div>
    </CardContent>

    <CardFooter class="goal-footer">
      <Button variant="ghost" size="sm" disabled class="opacity-70">Szczegóły wkrótce</Button>
    </CardFooter>
  </Card>
</template>

<style scoped>
@reference "../../../assets/base.css";

.goal-card {
  @apply h-full rounded-xl border border-border bg-card/50 shadow-sm;
}

.goal-title {
  @apply flex items-center gap-2 text-lg font-semibold;
}

.goal-scope {
  @apply rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground;
}

.goal-content {
  @apply space-y-3;
}

.goal-row {
  @apply flex items-center justify-between text-sm;
}

.label {
  @apply text-muted-foreground;
}

.value {
  @apply font-medium text-foreground;
}

.progress-block {
  @apply space-y-2;
}

.progress-header {
  @apply flex items-center justify-between text-sm font-medium;
}

.percent {
  @apply text-foreground;
}

.progress-bar {
  @apply h-2;
}

.goal-footer {
  @apply pt-2;
}
</style>

