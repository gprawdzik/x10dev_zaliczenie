<template>
  <div class="goal-list">
    <div v-if="isLoading" class="loading-state">
      <div class="goals-grid">
        <Skeleton v-for="i in 6" :key="i" class="goal-skeleton" />
      </div>
    </div>

    <div v-else-if="goals.length === 0" class="empty-state">
      <div class="empty-content">
        <div class="empty-icon">🎯</div>
        <h3 class="empty-title">Brak celów</h3>
        <p class="empty-description">
          Nie masz jeszcze żadnych celów. Dodaj swój pierwszy cel, aby zacząć śledzić postęp treningowy.
        </p>
      </div>
    </div>

    <div v-else class="goals-grid">
      <GoalCard
        v-for="goal in goals"
        :key="goal.id"
        :goal="goal"
        :sport-name="getSportName(goal.sport_id)"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton/index.js';

import GoalCard from './GoalCard.vue';

import type { GoalDto, SportDto } from '../../../types.js';

interface Props {
  goals: GoalDto[];
  sports: Record<string, SportDto>;
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
});

defineEmits<{
  edit: [goal: GoalDto];
  delete: [goal: GoalDto];
}>();

const getSportName = (sportId: string | null): string | undefined => {
  if (!sportId || !props.sports[sportId]) {
    return undefined;
  }
  return props.sports[sportId].name;
};
</script>

<style scoped>
@reference "../../../assets/base.css";

.goal-list {
  @apply w-full;
}

.loading-state,
.empty-state,
.goals-grid {
  @apply min-h-[200px];
}

.goals-grid {
  @apply grid gap-4 sm:grid-cols-2 lg:grid-cols-3;
}

.goal-skeleton {
  @apply h-48 w-full;
}

.empty-state {
  @apply flex items-center justify-center py-12;
}

.empty-content {
  @apply text-center space-y-4;
}

.empty-icon {
  @apply text-6xl;
}

.empty-title {
  @apply text-lg font-semibold;
}

.empty-description {
  @apply text-sm text-muted-foreground max-w-md;
}
</style>
