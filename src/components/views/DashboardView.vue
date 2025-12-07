<script setup lang="ts">
import { computed } from 'vue';

import ActivitiesBreakdown from './dashboard/ActivitiesBreakdown.vue';
import StatCard from './dashboard/StatCard.vue';
import { useDashboardData } from '@/composables/useDashboardData.js';

const {
  goalsState,
  activitiesState,
  metrics,
  errorMessage,
  isLoading,
  retry,
} = useDashboardData();

const showError = computed(() => errorMessage.value);
const isAnyLoading = computed(() => isLoading.value);
</script>

<template>
  <section class="space-y-6">
    <header class="space-y-3">
      <div>
        <p class="text-sm font-medium text-muted-foreground">Podsumowanie</p>
        <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 class="text-3xl font-semibold tracking-tight text-foreground">Dashboard</h1>
            <p class="text-muted-foreground">
              Najważniejsze metryki Twoich celów i aktywności za bieżący rok.
            </p>
          </div>
        </div>
      </div>
      <p v-if="showError" class="text-sm text-destructive">
        {{ showError }}
      </p>
    </header>

    <div class="grid gap-4 md:grid-cols-3">
      <StatCard
        label="Cele (osiągnięte / ogółem)"
        :value="`${metrics.achievedGoals} / ${metrics.totalGoals}`"
        :is-loading="isAnyLoading"
        :error="goalsState.error"
      />
      <ActivitiesBreakdown
        title="Aktywności w tym miesiącu"
        :items="metrics.activitiesMonth"
        :is-loading="activitiesState.isLoading"
        empty-label="Brak aktywności w tym miesiącu"
      />
      <ActivitiesBreakdown
        title="Aktywności w tym roku"
        :items="metrics.activitiesYear"
        :is-loading="activitiesState.isLoading"
        empty-label="Brak aktywności w tym roku"
      />
    </div>
  </section>
</template>

