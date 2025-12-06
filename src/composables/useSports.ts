import { ref } from 'vue';

import type { SportDto } from '../types.js';

export function useSports() {
  const isServer = typeof window === 'undefined';
  const sports = ref<SportDto[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const fetchSports = async () => {
    if (isServer) {
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const response = await fetch('/api/sports', {
        credentials: 'include',
      });

      if (!response.ok) {
        const payload = await safeParseJson(response);
        const message =
          (payload && typeof payload === 'object' && 'error' in payload &&
           payload.error && typeof payload.error === 'object' && 'message' in payload.error &&
           typeof payload.error.message === 'string' ? payload.error.message : null) ??
          'Nie udało się załadować sportów. Spróbuj ponownie później.';
        throw new Error(message);
      }

      const payload = await response.json() as SportDto[];
      sports.value = payload ?? [];
    } catch (caughtError) {
      console.error('Failed to load sports list', caughtError);
      sports.value = [];
      error.value =
        caughtError instanceof Error
          ? caughtError.message
          : 'Nie udało się załadować sportów. Spróbuj ponownie później.';
    } finally {
      isLoading.value = false;
    }
  };

  if (!isServer) {
    // Auto-fetch on mount
    void fetchSports();
  }

  return {
    sports,
    isLoading,
    error,
    fetchSports,
  };
}

async function safeParseJson(response: Response) {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}
