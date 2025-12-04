import { ref, computed } from 'vue';

import type { GoalDto, Paginated } from '../types.js';
import type { GoalsQuery } from '../validators/goals.js';

type UseGoalsOptions = Partial<{}>;

export function useGoals(options: UseGoalsOptions = {}) {
  const isServer = typeof window === 'undefined';
  const goals = ref<GoalDto[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
  });

  const query = ref<GoalsQuery>({
    page: 1,
    limit: 20,
    sort_by: 'created_at',
    sort_dir: 'desc',
  });

  const totalPages = computed(() => {
    if (!pagination.value.total) {
      return 1;
    }
    return Math.max(1, Math.ceil(pagination.value.total / pagination.value.limit));
  });

  const buildQueryString = () => {
    const search = new URLSearchParams();
    search.set('page', String(query.value.page));
    search.set('limit', String(query.value.limit));
    search.set('sort_by', query.value.sort_by);
    search.set('sort_dir', query.value.sort_dir);
    return search.toString();
  };

  const fetchGoals = async (newQuery?: Partial<GoalsQuery>) => {
    if (isServer) {
      return;
    }

    if (newQuery) {
      query.value = { ...query.value, ...newQuery };
    }

    isLoading.value = true;
    error.value = null;

    try {
      const response = await fetch(`/api/goals?${buildQueryString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const payload = await safeParseJson(response);
        const message =
          (payload && typeof payload === 'object' && 'error' in payload &&
           payload.error && typeof payload.error === 'object' && 'message' in payload.error &&
           typeof payload.error.message === 'string' ? payload.error.message : null) ??
          'Nie udało się załadować celów. Spróbuj ponownie później.';
        throw new Error(message);
      }

      const payload = (await response.json()) as Paginated<GoalDto>;

      // Validate response structure
      if (!payload || typeof payload !== 'object') {
        throw new Error('Serwer zwrócił nieprawidłową strukturę danych');
      }

      // Ensure data is an array
      if (!Array.isArray(payload.data)) {
        console.warn('API zwróciło nieprawidłowe dane - oczekiwano tablicy celów');
        goals.value = [];
      } else {
        goals.value = payload.data;
      }

      pagination.value = {
        page: Math.max(1, payload.page ?? 1),
        limit: Math.max(1, payload.limit ?? 20),
        total: Math.max(0, payload.total ?? 0),
      };
    } catch (caughtError) {
      console.error('Failed to load goals list', caughtError);
      goals.value = [];
      error.value =
        caughtError instanceof Error
          ? caughtError.message
          : 'Nie udało się załadować celów. Spróbuj ponownie później.';
    } finally {
      isLoading.value = false;
    }
  };

  const addGoal = async (data: {
    scope_type: 'global' | 'per_sport';
    sport_id?: string | null;
    metric_type: 'distance' | 'time' | 'elevation_gain';
    target_value: number;
  }) => {
    if (isServer) {
      return;
    }

    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const payload = await safeParseJson(response);
        const message =
          (payload && typeof payload === 'object' && 'error' in payload &&
           payload.error && typeof payload.error === 'object' && 'message' in payload.error &&
           typeof payload.error.message === 'string' ? payload.error.message : null) ??
          'Nie udało się dodać celu. Spróbuj ponownie później.';
        throw new Error(message);
      }

      const responseData = await response.json();

      // Validate response structure
      if (!responseData || typeof responseData !== 'object' || !responseData.id) {
        throw new Error('Serwer zwrócił nieprawidłowe dane celu');
      }

      const newGoal = responseData as GoalDto;
      goals.value.push(newGoal);
      return newGoal;
    } catch (caughtError) {
      const message = caughtError instanceof Error
        ? caughtError.message
        : 'Nie udało się dodać celu. Spróbuj ponownie później.';
      throw new Error(message);
    }
  };

  const updateGoal = async (id: string, data: {
    target_value: number;
  }) => {
    if (isServer) {
      return;
    }

    try {
      const response = await fetch(`/api/goals?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const payload = await safeParseJson(response);
        const message =
          (payload && typeof payload === 'object' && 'error' in payload &&
           payload.error && typeof payload.error === 'object' && 'message' in payload.error &&
           typeof payload.error.message === 'string' ? payload.error.message : null) ??
          'Nie udało się zaktualizować celu. Spróbuj ponownie później.';
        throw new Error(message);
      }

      const responseData = await response.json();

      // Validate response structure
      if (!responseData || typeof responseData !== 'object' || !responseData.id) {
        throw new Error('Serwer zwrócił nieprawidłowe dane zaktualizowanego celu');
      }

      const updatedGoal = responseData as GoalDto;
      const index = goals.value.findIndex(goal => goal.id === id);
      if (index !== -1) {
        goals.value[index] = updatedGoal;
      }
      return updatedGoal;
    } catch (caughtError) {
      const message = caughtError instanceof Error
        ? caughtError.message
        : 'Nie udało się zaktualizować celu. Spróbuj ponownie później.';
      throw new Error(message);
    }
  };

  const removeGoal = async (id: string) => {
    if (isServer) {
      return;
    }

    try {
      const response = await fetch(`/api/goals?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const payload = await safeParseJson(response);
        const message =
          (payload && typeof payload === 'object' && 'error' in payload &&
           payload.error && typeof payload.error === 'object' && 'message' in payload.error &&
           typeof payload.error.message === 'string' ? payload.error.message : null) ??
          'Nie udało się usunąć celu. Spróbuj ponownie później.';
        throw new Error(message);
      }

      goals.value = goals.value.filter(goal => goal.id !== id);
    } catch (caughtError) {
      const message = caughtError instanceof Error
        ? caughtError.message
        : 'Nie udało się usunąć celu. Spróbuj ponownie później.';
      throw new Error(message);
    }
  };

  const refresh = () => fetchGoals();

  if (!isServer) {
    // Auto-fetch on mount
    void fetchGoals();
  }

  return {
    goals,
    isLoading,
    error,
    pagination,
    totalPages,
    addGoal,
    updateGoal,
    removeGoal,
    refresh,
    fetchGoals,
  };
}

async function safeParseJson(response: Response) {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}
