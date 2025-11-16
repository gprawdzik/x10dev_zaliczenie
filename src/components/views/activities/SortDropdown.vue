<script setup lang="ts">
import { computed } from 'vue';

import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import type { ActivitySortDirection, ActivitySortField, SortOption } from '@/types';

const props = withDefaults(
  defineProps<{
    sortBy: ActivitySortField;
    sortDir: ActivitySortDirection;
    options: SortOption[];
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  }
);

const emit = defineEmits<{
  (event: 'sort-change', payload: { sortBy: ActivitySortField; sortDir: ActivitySortDirection }): void;
}>();

const selectedOption = computed(
  () => props.options.find((option) => option.value === props.sortBy)?.label ?? '—'
);

const handleSortFieldChange = (value: string) => {
  emit('sort-change', {
    sortBy: value as ActivitySortField,
    sortDir: props.sortDir,
  });
};

const toggleDirection = () => {
  const nextDir: ActivitySortDirection = props.sortDir === 'asc' ? 'desc' : 'asc';
  emit('sort-change', {
    sortBy: props.sortBy,
    sortDir: nextDir,
  });
};
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <label
      for="activities-sort-field"
      class="text-sm font-medium text-muted-foreground"
    >
      Sortowanie
    </label>

    <div class="flex items-center gap-2">
      <Select
        id="activities-sort-field"
        :model-value="props.sortBy"
        :disabled="props.disabled"
        class="min-w-[160px]"
        @update:modelValue="handleSortFieldChange"
      >
        <option
          v-for="option in props.options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </Select>

      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        class="w-10"
        :disabled="props.disabled"
        :title="`Zmień kolejność sortowania (${selectedOption})`"
        @click="toggleDirection"
      >
        <span class="sr-only">Zmień kierunek sortowania</span>
        <span aria-hidden="true">
          {{ props.sortDir === 'asc' ? '↑' : '↓' }}
        </span>
      </Button>

      <p class="text-xs text-muted-foreground">
        {{ props.sortDir === 'asc' ? 'Rosnąco' : 'Malejąco' }}
      </p>
    </div>
  </div>
</template>

