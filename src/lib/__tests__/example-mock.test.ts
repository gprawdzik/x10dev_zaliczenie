import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

/**
 * Example test demonstrating Vitest mocking capabilities
 */

// Example function to test
function fetchUserData(userId: string): Promise<{ id: string; name: string }> {
  return fetch(`/api/users/${userId}`)
    .then(res => res.json());
}

// Example class to test
class DataService {
  async getData() {
    const response = await fetch('/api/data');
    return response.json();
  }

  processData(data: number[]): number {
    return data.reduce((sum, val) => sum + val, 0);
  }
}

describe('Vitest Mocking Examples', () => {
  describe('Function Mocks', () => {
    it('should create a mock function with vi.fn()', () => {
      // Create a mock function
      const mockFn = vi.fn();
      
      // Use the mock
      mockFn('test');
      mockFn('test2');
      
      // Verify interactions
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenCalledWith('test');
      expect(mockFn).toHaveBeenNthCalledWith(2, 'test2');
    });

    it('should mock function return values', () => {
      const mockFn = vi.fn()
        .mockReturnValueOnce('first')
        .mockReturnValueOnce('second')
        .mockReturnValue('default');
      
      expect(mockFn()).toBe('first');
      expect(mockFn()).toBe('second');
      expect(mockFn()).toBe('default');
      expect(mockFn()).toBe('default');
    });

    it('should mock async functions', async () => {
      const mockAsyncFn = vi.fn()
        .mockResolvedValue({ success: true });
      
      const result = await mockAsyncFn();
      expect(result).toEqual({ success: true });
    });
  });

  describe('Spy Examples', () => {
    it('should spy on object methods', () => {
      const service = new DataService();
      const spy = vi.spyOn(service, 'processData');
      
      const result = service.processData([1, 2, 3]);
      
      // Verify the spy was called
      expect(spy).toHaveBeenCalledWith([1, 2, 3]);
      expect(result).toBe(6);
      
      spy.mockRestore();
    });

    it('should spy without changing behavior', () => {
      const service = new DataService();
      const spy = vi.spyOn(service, 'processData');
      
      // Original implementation still works
      expect(service.processData([10, 20])).toBe(30);
      expect(spy).toHaveBeenCalled();
      
      spy.mockRestore();
    });
  });

  describe('Global Mocks', () => {
    beforeEach(() => {
      // Mock global fetch
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should mock global fetch', async () => {
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      
      mockFetch.mockResolvedValue({
        json: async () => ({ id: '123', name: 'Test User' }),
      } as Response);
      
      const data = await fetchUserData('123');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/users/123');
      expect(data).toEqual({ id: '123', name: 'Test User' });
    });
  });

  describe('Inline Snapshots', () => {
    it('should use inline snapshots', () => {
      const user = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
      };
      
      // First run will create the snapshot, subsequent runs will compare
      expect(user).toMatchInlineSnapshot(`
        {
          "email": "john@example.com",
          "id": "1",
          "name": "John Doe",
        }
      `);
    });
  });

  describe('Timers', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should advance timers', () => {
      const callback = vi.fn();
      
      setTimeout(callback, 1000);
      
      expect(callback).not.toHaveBeenCalled();
      
      // Fast-forward time
      vi.advanceTimersByTime(1000);
      
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('Type Testing', () => {
    it('should verify types with expectTypeOf', () => {
      type User = { id: string; name: string };
      
      const user: User = { id: '1', name: 'Test' };
      
      // Type-level assertions
      expectTypeOf(user).toMatchTypeOf<User>();
      expectTypeOf(user.id).toBeString();
      expectTypeOf(user.name).toBeString();
    });
  });
});

