<template>
  <div class="goals-header">
    <div class="header-content">
      <h1 class="header-title">Moje cele</h1>
      <p class="header-subtitle">
        Zarządzaj swoimi rocznymi celami treningowymi i śledź postęp
      </p>
    </div>
    <Button @click="$emit('add-goal')" class="add-goal-button">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="plus-icon">
        <path d="M12 4V20M20 12H4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Dodaj cel
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button/index.js';

defineEmits<{
  'add-goal': [];
}>();
</script>

<style scoped>
@reference "../../../assets/base.css";

.goals-header {
  @apply flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between;
}

.header-content {
  @apply space-y-1;
}

.header-title {
  @apply text-2xl font-bold tracking-tight;
}

.header-subtitle {
  @apply text-muted-foreground;
}

.add-goal-button {
  @apply shrink-0;
}

.plus-icon {
  @apply mr-2;
}
</style>
