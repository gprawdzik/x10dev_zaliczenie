<script setup lang="ts">
import { computed } from 'vue';

import ProgressGoalCard from './ProgressGoalCard.vue';
import SkeletonRow from './SkeletonRow.vue';
import { Button } from '@/components/ui/button/index.js';
import type { GoalCardVM } from '@/lib/view-models/progress.js';

interface Props {
  items: GoalCardVM[];
  page: number;
  pageSize: number;
  total: number;
  loading?: boolean;
  error?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
});

const emit = defineEmits<{
  (e: 'page-change', page: number): void;
  (e: 'progress', goal: GoalCardVM): void;
  (e: 'retry'): void;
}>();

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)));
const canPrev = computed(() => props.page > 1);
const canNext = computed(() => props.page < totalPages.value);

function handlePrev() {
  if (canPrev.value) emit('page-change', props.page - 1);
}

function handleNext() {
  if (canNext.value) emit('page-change', props.page + 1);
}
</script>

<template>
  <div class="list-header">
    <div>
      <p class="title">Karty celów</p>
      <p class="subtitle">Podsumowanie postępów dla bieżących filtrów</p>
    </div>
    <div class="pager" v-if="total > 0">
      <Button variant="outline" size="sm" :disabled="!canPrev" @click="handlePrev">Poprzednia</Button>
      <span class="page-indicator">{{ page }} / {{ totalPages }}</span>
      <Button variant="outline" size="sm" :disabled="!canNext" @click="handleNext">Następna</Button>
    </div>
  </div>

  <SkeletonRow v-if="loading" :rows="pageSize" variant="card" />

  <div v-else-if="error" class="error">
    <div>
      <p class="error-title">Nie udało się załadować celów</p>
      <p class="error-text">{{ error }}</p>
    </div>
    <Button variant="outline" size="sm" @click="$emit('retry')">Spróbuj ponownie</Button>
  </div>

  <div v-else-if="!items.length" class="empty">
    <p class="empty-title">Brak kart celów</p>
    <p class="empty-text">Dodaj cele lub zmień filtry, aby zobaczyć postęp.</p>
  </div>

  <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    <ProgressGoalCard
      v-for="goal in items"
      :key="goal.id"
      :goal="goal"
      @click="$emit('progress', goal)"
    />
  </div>
</template>

<style scoped>
@reference "../../../assets/base.css";

.list-header {
  @apply mb-3 flex flex-col justify-between gap-3 md:flex-row md:items-center;
}

.title {
  @apply text-lg font-semibold;
}

.subtitle {
  @apply text-sm text-muted-foreground;
}

.pager {
  @apply flex items-center gap-2;
}

.page-indicator {
  @apply text-sm text-muted-foreground;
}

.error {
  @apply flex items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3;
}

.error-title {
  @apply text-sm font-semibold text-destructive;
}

.error-text {
  @apply text-sm text-muted-foreground;
}

.empty {
  @apply rounded-lg border border-dashed border-border px-4 py-6 text-center;
}

.empty-title {
  @apply text-base font-semibold;
}

.empty-text {
  @apply text-sm text-muted-foreground;
}
</style>

