<script setup lang="ts">
import type { SportDto } from '@/types';

// Props
interface Props {
  sports: SportDto[];
}

defineProps<Props>();
</script>

<template>
  <div class="sport-list">
    <!-- Informacja o braku sportów -->
    <div v-if="sports.length === 0" class="text-sm text-muted-foreground">
      Brak sportów do wyświetlenia
    </div>

    <!-- Tabela sportów -->
    <div v-else class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr class="border-b">
            <th class="text-left p-2 font-semibold">Kod</th>
            <th class="text-left p-2 font-semibold">Nazwa</th>
            <th class="text-left p-2 font-semibold">Opis</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="sport in sports"
            :key="sport.id"
            class="border-b hover:bg-muted/50 transition-colors"
          >
            <td class="p-2 font-mono text-sm">{{ sport.code }}</td>
            <td class="p-2">{{ sport.name }}</td>
            <td class="p-2 text-sm text-muted-foreground">
              {{ sport.description || '-' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
table {
  min-width: 100%;
}

th {
  font-size: 0.875rem;
}
</style>

