<script setup lang="ts">
import { computed } from 'vue';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/composables/useTheme';

const { theme, toggleTheme } = useTheme();

const isDarkMode = computed(() => theme.value === 'dark');
const icon = computed(() => (isDarkMode.value ? '🌙' : '☀️'));
const currentLabel = computed(() => (isDarkMode.value ? 'Tryb ciemny' : 'Tryb jasny'));
const nextLabel = computed(() => (isDarkMode.value ? 'jasny' : 'ciemny'));
</script>

<template>
  <Button
    type="button"
    variant="ghost"
    size="sm"
    class="theme-toggle"
    @click="toggleTheme"
    :aria-label="`Przełącz na ${nextLabel} tryb`"
    :title="`Aktualnie ${currentLabel}. Kliknij, aby przełączyć na ${nextLabel} tryb.`"
  >
    <span class="theme-toggle__icon" aria-hidden="true">{{ icon }}</span>
    <span class="theme-toggle__text">{{ currentLabel }}</span>
  </Button>
</template>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.theme-toggle__icon {
  font-size: 1.25rem;
  line-height: 1;
}

.theme-toggle__text {
  font-size: 0.875rem;
}

@media (max-width: 767px) {
  .theme-toggle__text {
    display: none;
  }
}
</style>

