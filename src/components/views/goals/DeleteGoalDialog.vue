<template>
  <Dialog :open="open" @update:open="$emit('close')">
    <DialogContent class="delete-dialog">
      <DialogHeader>
        <DialogTitle>Usuń cel</DialogTitle>
        <DialogDescription>
          Czy na pewno chcesz usunąć ten cel? Tej akcji nie można cofnąć.
        </DialogDescription>
      </DialogHeader>

      <div v-if="goal" class="goal-summary">
        <div class="goal-info">
          <div class="goal-name">
            {{ goal.scope_type === 'global' ? 'Globalny' : 'Sportowy' }} cel
          </div>
          <div class="goal-details">
            {{ getMetricLabel(goal.metric_type) }}: {{ formatTargetValue(goal.metric_type, goal.target_value) }}
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" @click="$emit('close')" :disabled="isDeleting">
          Anuluj
        </Button>
        <Button
          type="button"
          variant="destructive"
          @click="$emit('confirm')"
          :disabled="isDeleting"
        >
          {{ isDeleting ? 'Usuwanie...' : 'Usuń' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

import { Button } from '@/components/ui/button/index.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog/index.js';

import type { GoalDto } from '../../../types.js';

interface Props {
  open: boolean;
  goal?: GoalDto | null;
}

const props = withDefaults(defineProps<Props>(), {
  goal: null,
});

defineEmits<{
  close: [];
  confirm: [];
}>();

const isDeleting = ref(false);

// Reset deleting state when dialog closes
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      isDeleting.value = false;
    }
  }
);

function getMetricLabel(metricType: string): string {
  switch (metricType) {
    case 'distance':
      return 'Dystans';
    case 'time':
      return 'Czas';
    case 'elevation_gain':
      return 'Przewyższenie';
    default:
      return 'Nieznana metryka';
  }
}

function formatTargetValue(metricType: string, value: number): string {
  switch (metricType) {
    case 'distance':
      return `${value} km`;
    case 'time':
      return `${value} h`;
    case 'elevation_gain':
      return `${value} m`;
    default:
      return String(value);
  }
}
</script>

<style scoped>
@reference "../../../assets/base.css";

.delete-dialog {
  @apply max-w-md;
}

.goal-summary {
  @apply py-4;
}

.goal-info {
  @apply space-y-2 p-4 bg-muted/50 rounded-lg;
}

.goal-name {
  @apply font-medium;
}

.goal-details {
  @apply text-sm text-muted-foreground;
}
</style>
