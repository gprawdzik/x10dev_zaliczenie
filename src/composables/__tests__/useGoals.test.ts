import { describe, expect, it, vi } from 'vitest';

import { useGoals } from '../useGoals.js';

// Mock fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('useGoals composable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful fetch response to prevent actual API calls
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: [],
        page: 1,
        limit: 20,
        total: 0
      })
    });
  });

  it('should initialize with default values', async () => {
    const { goals, isLoading, error, pagination } = useGoals();

    // Wait for the initial fetch to complete
    await vi.waitFor(() => {
      expect(isLoading.value).toBe(false);
    });

    expect(goals.value).toEqual([]);
    expect(error.value).toBe(null);
    expect(pagination.value.page).toBe(1);
    expect(pagination.value.limit).toBe(20);
    expect(pagination.value.total).toBe(0);
  });


  it('should calculate total pages correctly', () => {
    const { pagination, totalPages } = useGoals();

    pagination.value.total = 45;
    expect(totalPages.value).toBe(3);

    pagination.value.total = 40;
    expect(totalPages.value).toBe(2);

    pagination.value.total = 0;
    expect(totalPages.value).toBe(1);
  });


  it('should handle addGoal function structure', () => {
    const { addGoal } = useGoals();

    expect(typeof addGoal).toBe('function');
    // Note: Full testing of async functions would require mocking fetch
  });

  it('should handle updateGoal function structure', () => {
    const { updateGoal } = useGoals();

    expect(typeof updateGoal).toBe('function');
    // Note: Full testing of async functions would require mocking fetch
  });

  it('should handle removeGoal function structure', () => {
    const { removeGoal } = useGoals();

    expect(typeof removeGoal).toBe('function');
    // Note: Full testing of async functions would require mocking fetch
  });

  it('should provide refresh function', () => {
    const { refresh } = useGoals();

    expect(typeof refresh).toBe('function');
  });
});
