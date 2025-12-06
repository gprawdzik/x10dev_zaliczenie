import { describe, expect, it, vi } from 'vitest';

import { useSports } from '../useSports.js';

// Mock fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('useSports composable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful fetch response to prevent actual API calls
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    });
  });

  it('should initialize with default values', async () => {
    const { sports, isLoading, error } = useSports();

    // Wait for the initial fetch to complete
    await vi.waitFor(() => {
      expect(isLoading.value).toBe(false);
    });

    expect(sports.value).toEqual([]);
    expect(error.value).toBe(null);
  });

  it('should provide fetchSports function', () => {
    const { fetchSports } = useSports();

    expect(typeof fetchSports).toBe('function');
  });
});
