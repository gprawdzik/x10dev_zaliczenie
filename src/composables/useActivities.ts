import { computed, reactive, ref, watch } from 'vue';

import type {
  ActivityDto,
  ActivitySortDirection,
  ActivitySortField,
  ActivityViewModel,
  Paginated,
} from '../types.js';
import { activityDtoToViewModel } from '../lib/formatters.js';

const DEFAULT_PAGE_LIMIT = 20;
const DEFAULT_SORT_BY: ActivitySortField = 'start_date';
const DEFAULT_SORT_DIR: ActivitySortDirection = 'desc';

type ActivitiesResponse = Paginated<ActivityDto>;

type UseActivitiesOptions = Partial<{
  page: number;
  limit: number;
  sortBy: ActivitySortField;
  sortDir: ActivitySortDirection;
  sportType: string;
  from: string;
  to: string;
}>;

export function useActivities(options: UseActivitiesOptions = {}) {
  const isServer = typeof window === 'undefined';
  const activities = ref<ActivityViewModel[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const pagination = reactive({
    page: options.page ?? 1,
    limit: options.limit ?? DEFAULT_PAGE_LIMIT,
    total: 0,
  });

  const sorting = reactive({
    sortBy: options.sortBy ?? DEFAULT_SORT_BY,
    sortDir: options.sortDir ?? DEFAULT_SORT_DIR,
  });

  const filters = reactive({
    sportType: options.sportType ?? '',
    from: options.from ?? '',
    to: options.to ?? '',
  });

  const totalPages = computed(() => {
    if (!pagination.total) {
      return 1;
    }
    return Math.max(1, Math.ceil(pagination.total / pagination.limit));
  });

  const pageMeta = computed(() => {
    if (!pagination.total) {
      return { start: 0, end: 0, total: 0 };
    }
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(pagination.page * pagination.limit, pagination.total);
    return { start, end, total: pagination.total };
  });

  let activeController: AbortController | null = null;

  const buildQueryString = () => {
    const search = new URLSearchParams();
    search.set('page', String(pagination.page));
    search.set('limit', String(pagination.limit));
    search.set('sort_by', sorting.sortBy);
    search.set('sort_dir', sorting.sortDir);
    if (filters.sportType) {
      search.set('sport_type', filters.sportType);
    }
    if (filters.from) {
      search.set('from', toIsoRange(filters.from, 'start'));
    }
    if (filters.to) {
      search.set('to', toIsoRange(filters.to, 'end'));
    }
    return search.toString();
  };

  const fetchActivities = async () => {
    if (isServer) {
      return;
    }

    if (activeController) {
      activeController.abort();
    }

    const controller = new AbortController();
    activeController = controller;

    isLoading.value = true;
    error.value = null;

    try {
      const response = await fetch(`/api/activities?${buildQueryString()}`, {
        signal: controller.signal,
        credentials: 'include',
      });

      if (!response.ok) {
        const payload = await safeParseJson(response);
        const message =
          (payload && typeof payload === 'object' && 'error' in payload && 
           payload.error && typeof payload.error === 'object' && 'message' in payload.error &&
           typeof payload.error.message === 'string' ? payload.error.message : null) ??
          'Nie udało się załadować aktywności. Spróbuj ponownie później.';
        throw new Error(message);
      }

      const payload = (await response.json()) as ActivitiesResponse;
      pagination.total = payload.total ?? 0;
      pagination.limit = payload.limit ?? pagination.limit;
      pagination.page = payload.page ?? pagination.page;
      activities.value = (payload.data ?? []).map(activityDtoToViewModel);
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === 'AbortError') {
        return;
      }
      console.error('Failed to load activities list', caughtError);
      activities.value = [];
      error.value =
        caughtError instanceof Error
          ? caughtError.message
          : 'Nie udało się załadować aktywności. Spróbuj ponownie później.';
    } finally {
      if (activeController === controller) {
        activeController = null;
      }
      isLoading.value = false;
    }
  };

  if (!isServer) {
    watch(
      () => [
        pagination.page,
        pagination.limit,
        sorting.sortBy,
        sorting.sortDir,
        filters.sportType,
        filters.from,
        filters.to,
      ],
      () => {
        void fetchActivities();
      },
      { immediate: true }
    );
  }

  const changePage = (nextPage: number) => {
    if (!Number.isFinite(nextPage)) {
      return;
    }

    const safePage = Math.max(1, Math.min(nextPage, totalPages.value));
    if (safePage === pagination.page) {
      void fetchActivities();
      return;
    }

    pagination.page = safePage;
  };

  const changeSort = (nextSortBy: ActivitySortField, nextSortDir: ActivitySortDirection) => {
    const unchanged = sorting.sortBy === nextSortBy && sorting.sortDir === nextSortDir;
    sorting.sortBy = nextSortBy;
    sorting.sortDir = nextSortDir;
    pagination.page = 1;

    if (unchanged) {
      void fetchActivities();
    }
  };

  const refresh = () => {
    return fetchActivities();
  };

  const setItemsPerPage = (nextLimit: number) => {
    if (!Number.isFinite(nextLimit) || nextLimit <= 0) {
      return;
    }

    const safeLimit = Math.min(100, Math.max(5, Math.round(nextLimit)));
    if (safeLimit === pagination.limit) {
      return;
    }
    pagination.limit = safeLimit;
    pagination.page = 1;
  };

  const setSportFilter = (value: string) => {
    const normalized = value?.trim() ?? '';
    if (filters.sportType === normalized) {
      return;
    }
    filters.sportType = normalized;
    pagination.page = 1;
  };

  const setDateFrom = (value: string | number) => {
    const normalized = normalizeDateInput(value);
    if (filters.from === normalized) {
      return;
    }
    filters.from = normalized;
    if (filters.to && normalized && normalized > filters.to) {
      filters.to = normalized;
    }
    pagination.page = 1;
  };

  const setDateTo = (value: string | number) => {
    const normalized = normalizeDateInput(value);
    if (filters.to === normalized) {
      return;
    }
    filters.to = normalized;
    if (filters.from && normalized && normalized < filters.from) {
      filters.from = normalized;
    }
    pagination.page = 1;
  };

  const resetFilters = () => {
    const changed = Boolean(filters.sportType || filters.from || filters.to);
    filters.sportType = '';
    filters.from = '';
    filters.to = '';
    if (changed) {
      pagination.page = 1;
    }
  };

  const hasActiveFilters = computed(() => Boolean(filters.sportType || filters.from || filters.to));

  return {
    activities,
    isLoading,
    error,
    pagination,
    sorting,
    totalPages,
    pageMeta,
    filters,
    hasActiveFilters,
    changePage,
    changeSort,
    refresh,
    setItemsPerPage,
    setSportFilter,
    setDateFrom,
    setDateTo,
    resetFilters,
  };
}

async function safeParseJson(response: Response) {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeDateInput(value: string | number | null | undefined): string {
  if (!value) {
    return '';
  }
  return typeof value === 'string' ? value : String(value);
}

function toIsoRange(dateInput: string, mode: 'start' | 'end'): string {
  const isoString = `${dateInput}T${mode === 'start' ? '00:00:00' : '23:59:59'}Z`;
  const date = new Date(isoString);
  return Number.isNaN(date.getTime()) ? isoString : date.toISOString();
}


