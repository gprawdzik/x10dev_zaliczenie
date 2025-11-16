<script setup lang="ts">
import { computed } from 'vue';

import { Button } from '@/components/ui/button';

const props = withDefaults(
  defineProps<{
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  }
);

const emit = defineEmits<{
  (event: 'page-change', page: number): void;
}>();

const canGoPrev = computed(() => props.currentPage > 1);
const canGoNext = computed(() => props.currentPage < props.totalPages);

const visiblePages = computed(() => {
  const pages: number[] = [];
  const maxVisible = 5;
  const totalPages = Math.max(1, props.totalPages);
  let start = Math.max(1, props.currentPage - 2);
  const end = Math.min(totalPages, start + maxVisible - 1);

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return pages;
});

const goToPage = (page: number) => {
  if (props.disabled || page === props.currentPage) {
    return;
  }

  const safePage = Math.max(1, Math.min(page, props.totalPages));
  emit('page-change', safePage);
};
</script>

<template>
  <nav
    class="flex items-center gap-2"
    role="navigation"
    aria-label="Nawigacja po stronach aktywności"
  >
    <Button
      type="button"
      variant="outline"
      size="sm"
      class="min-w-[90px]"
      :disabled="props.disabled || !canGoPrev"
      @click="goToPage(props.currentPage - 1)"
    >
      Poprzednia
    </Button>

    <div class="flex items-center gap-1">
      <Button
        v-for="page in visiblePages"
        :key="page"
        type="button"
        size="sm"
        :variant="page === props.currentPage ? 'default' : 'outline'"
        class="min-w-9"
        :disabled="props.disabled"
        @click="goToPage(page)"
      >
        {{ page }}
      </Button>
    </div>

    <Button
      type="button"
      variant="outline"
      size="sm"
      class="min-w-[90px]"
      :disabled="props.disabled || !canGoNext"
      @click="goToPage(props.currentPage + 1)"
    >
      Następna
    </Button>
  </nav>
</template>

