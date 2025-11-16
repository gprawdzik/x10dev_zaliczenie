<script setup lang="ts">
import { computed } from 'vue';

import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ActivityViewModel } from '@/types';

const props = defineProps<{
  activities: ActivityViewModel[];
  isLoading: boolean;
}>();

const columns = [
  { key: 'name', label: 'Aktywność' },
  { key: 'startDate', label: 'Data' },
  { key: 'distance', label: 'Dystans' },
  { key: 'duration', label: 'Czas trwania' },
  { key: 'elevation', label: 'Przewyższenie' },
  { key: 'pace', label: 'Tempo' },
] as const;

const hasActivities = computed(() => props.activities.length > 0);
const skeletonRows = Array.from({ length: 5 });
</script>

<template>
  <div class="px-6 py-4" aria-live="polite">
    <Table v-if="hasActivities || props.isLoading">
      <TableHeader>
        <TableRow>
          <TableHead
            v-for="column in columns"
            :key="column.key"
          >
            {{ column.label }}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <template v-if="props.isLoading">
          <TableRow
            v-for="(_, rowIndex) in skeletonRows"
            :key="rowIndex"
          >
            <TableCell
              v-for="column in columns"
              :key="`${column.key}-${rowIndex}`"
            >
              <Skeleton class="h-4 w-full" />
            </TableCell>
          </TableRow>
        </template>
        <template v-else>
          <TableRow
            v-for="activity in props.activities"
            :key="activity.id"
          >
            <TableCell>
              <p class="font-medium text-foreground">
                {{ activity.name }}
              </p>
              <p class="text-xs text-muted-foreground">
                {{ activity.type }}
              </p>
            </TableCell>
            <TableCell>
              {{ activity.startDate }}
            </TableCell>
            <TableCell>
              {{ activity.distance }}
            </TableCell>
            <TableCell>
              {{ activity.duration }}
            </TableCell>
            <TableCell>
              {{ activity.elevation }}
            </TableCell>
            <TableCell>
              {{ activity.pace }}
            </TableCell>
          </TableRow>
        </template>
      </TableBody>
    </Table>

    <div
      v-else
      class="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/10 px-6 py-12 text-center"
    >
      <p class="text-base font-medium text-foreground">
        Nie znaleziono żadnych aktywności
      </p>
      <p class="text-sm text-muted-foreground">
        Wygeneruj dane w ustawieniach, aby zobaczyć historię treningów w tym widoku.
      </p>
    </div>
  </div>
</template>

