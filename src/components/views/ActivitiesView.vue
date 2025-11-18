<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useActivities } from '@/composables/useActivities';
import type {
  ActivitySortDirection,
  ActivitySortField,
  SortOption,
  SportDto,
} from '@/types';

import ActivitiesTable from './activities/ActivitiesTable.vue';
import PaginationControl from './activities/PaginationControl.vue';
import SortDropdown from './activities/SortDropdown.vue';

const sortOptions: SortOption[] = [
  { value: 'start_date', label: 'Data' },
  { value: 'distance', label: 'Dystans' },
  { value: 'moving_time', label: 'Czas trwania' },
];

const {
  activities,
  isLoading,
  error,
  pagination,
  sorting,
  filters,
  totalPages,
  pageMeta,
  hasActiveFilters,
  changePage,
  changeSort,
  refresh,
  setItemsPerPage,
  setSportFilter,
  setDateFrom,
  setDateTo,
  resetFilters,
} = useActivities();

const summaryText = computed(() => {
  if (!pageMeta.value.total) {
    return 'Brak danych do wyświetlenia';
  }

  return `Wyświetlane ${pageMeta.value.start}-${pageMeta.value.end} z ${pageMeta.value.total} aktywności`;
});

const shouldShowPagination = computed(() => totalPages.value > 1);

const handleSortChange = (payload: { sortBy: ActivitySortField; sortDir: ActivitySortDirection }) => {
  changeSort(payload.sortBy, payload.sortDir);
};

const itemsPerPageOptions = [10, 20, 50];

const handleLimitChange = (value: string) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isNaN(parsed)) {
    setItemsPerPage(parsed);
  }
};

const sports = ref<SportDto[]>([]);
const sportsLoading = ref(false);
const sportsError = ref<string | null>(null);

const fetchSports = async () => {
  sportsLoading.value = true;
  sportsError.value = null;
  try {
    const response = await fetch('/api/sports', { credentials: 'include' });
    if (!response.ok) {
      throw new Error('Nie udało się pobrać listy sportów.');
    }
    sports.value = (await response.json()) as SportDto[];
  } catch (caughtError) {
    console.error('Failed to fetch sports', caughtError);
    sportsError.value = 'Nie udało się pobrać listy sportów.';
  } finally {
    sportsLoading.value = false;
  }
};

onMounted(() => {
  void fetchSports();
});

const sportOptions = computed(() =>
  sports.value.map((sport) => ({
    value: sport.code,
    label: sport.name ?? sport.code,
  }))
);
</script>

<template>
  <section class="space-y-6">
    <header class="space-y-1">
      <h1 class="text-3xl font-bold tracking-tight text-foreground">
        Historia treningów
      </h1>
    </header>

    <Card>
      <CardHeader class="gap-4 md:flex md:items-center md:justify-between">
        <SortDropdown
          :sort-by="sorting.sortBy"
          :sort-dir="sorting.sortDir"
          :options="sortOptions"
          :disabled="isLoading"
          @sort-change="handleSortChange"
        />
      </CardHeader>
      <CardContent class="space-y-6">
        <section class="rounded-lg border border-border/60 bg-muted/10 px-4 py-4">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div class="space-y-1">
              <p class="text-sm font-medium text-foreground">Filtry</p>
              <p class="text-xs text-muted-foreground">
                Zawężaj listę według sportu, zakresu dat lub liczby rekordów na stronę.
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                size="sm"
                :disabled="!hasActiveFilters"
                @click="resetFilters"
              >
                Resetuj filtry
              </Button>
              <Button
                variant="outline"
                size="sm"
                :disabled="sportsLoading"
                @click="fetchSports"
              >
                Odśwież sporty
              </Button>
            </div>
          </div>

          <div class="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-muted-foreground" for="filter-sport">Sport</label>
              <Select
                id="filter-sport"
                :model-value="filters.sportType"
                class="w-full"
                :disabled="sportsLoading || isLoading"
                @update:modelValue="setSportFilter"
              >
                <option value="">Wszystkie sporty</option>
                <option
                  v-for="option in sportOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </Select>
              <p
                v-if="sportsError"
                class="text-xs text-destructive"
              >
                {{ sportsError }}
              </p>
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-muted-foreground" for="filter-from">Data od</label>
              <Input
                id="filter-from"
                type="date"
                :model-value="filters.from"
                :max="filters.to || undefined"
                :disabled="isLoading"
                @update:modelValue="setDateFrom"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-muted-foreground" for="filter-to">Data do</label>
              <Input
                id="filter-to"
                type="date"
                :model-value="filters.to"
                :min="filters.from || undefined"
                :disabled="isLoading"
                @update:modelValue="setDateTo"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-muted-foreground" for="filter-limit">Elementów na stronę</label>
              <Select
                id="filter-limit"
                :model-value="pagination.limit"
                :disabled="isLoading"
                @update:modelValue="handleLimitChange"
              >
                <option
                  v-for="option in itemsPerPageOptions"
                  :key="option"
                  :value="option"
                >
                  {{ option }}
                </option>
              </Select>
            </div>
          </div>
        </section>

        <div
          v-if="error"
          class="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <p class="font-medium">
            {{ error }}
          </p>
          <p class="mt-2 text-xs opacity-80">
            Sprawdź połączenie z internetem lub spróbuj ponownie później. Błędy są logowane w konsoli
            developerskiej.
          </p>
          <Button
            class="mt-3"
            variant="outline"
            size="sm"
            :disabled="isLoading"
            @click="refresh"
          >
            Spróbuj ponownie
          </Button>
        </div>
        <template v-else>
          <ActivitiesTable
            :activities="activities"
            :is-loading="isLoading"
          />

          <div class="flex flex-col gap-4 border-t pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <p data-testid="activities-summary">
              {{ summaryText }}
            </p>

            <PaginationControl
              v-if="shouldShowPagination"
              :current-page="pagination.page"
              :total-pages="totalPages"
              :total-items="pageMeta.total"
              :items-per-page="pagination.limit"
              :disabled="isLoading"
              @page-change="changePage"
            />
          </div>
        </template>
      </CardContent>
    </Card>
  </section>
</template>

