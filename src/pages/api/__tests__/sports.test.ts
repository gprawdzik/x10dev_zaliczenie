import { afterEach, describe, expect, it, vi, type MockedFunction } from 'vitest';

import { beforeAll } from 'vitest';
import { requireAuth } from '@/middleware/requireAuth';
import { createSport } from '@/services/sports/createSport';

vi.mock('@/services/sports/getSports', () => ({
  getSports: vi.fn(),
}));

vi.mock('@/db/supabase.client', () => ({
  supabaseClient: {} as unknown,
}));

vi.mock('@/middleware/requireAuth', async () => {
  const actual = await vi.importActual<typeof import('@/middleware/requireAuth')>(
    '@/middleware/requireAuth'
  );
  return {
    ...actual,
    requireAuth: vi.fn(),
  };
});

vi.mock('../sports.js', async () => {
  const actual = await vi.importActual<typeof import('../sports.js')>('../sports.js');
  return {
    ...actual,
  };
});

vi.mock('@/services/sports/createSport', async () => {
  const actual = await vi.importActual<typeof import('@/services/sports/createSport')>(
    '@/services/sports/createSport'
  );
  return {
    ...actual,
    createSport: vi.fn(),
  };
});

let POST: (typeof import('../sports.js'))['POST'];

beforeAll(async () => {
  const mod = await import('../sports.js');
  POST = mod.POST;
});

const makeRequest = (body: unknown) =>
  new Request('http://localhost/api/sports', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

describe('POST /api/sports admin guard', () => {
  const locals = { supabase: {} as unknown as never };
  const mockedRequireAuth = requireAuth as MockedFunction<typeof requireAuth>;
  const mockedCreateSport = createSport as MockedFunction<typeof createSport>;

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('allows admin users to create a sport', async () => {
    mockedRequireAuth.mockResolvedValue({
      userId: 'user-1',
      accessToken: 'token',
      user: { app_metadata: { role: 'admin' } },
    } as any);
    mockedCreateSport.mockResolvedValue({
      id: 'sport-1',
      code: 'run',
      name: 'Running',
      description: null,
      consolidated: null,
    } as any);

    const response = await POST({
      request: makeRequest({ code: 'run', name: 'Running' }),
      locals,
    } as any);

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.code).toBe('run');
    expect(mockedCreateSport).toHaveBeenCalledTimes(1);
  });

  it('rejects non-admin users with 403', async () => {
    mockedRequireAuth.mockResolvedValue({
      userId: 'user-2',
      accessToken: 'token',
      user: { app_metadata: { role: 'user' } },
    } as any);

    const response = await POST({
      request: makeRequest({ code: 'run', name: 'Running' }),
      locals,
    } as any);

    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error.code).toBe('forbidden');
    expect(mockedCreateSport).not.toHaveBeenCalled();
  });

  it('accepts roles array containing admin', async () => {
    mockedRequireAuth.mockResolvedValue({
      userId: 'user-3',
      accessToken: 'token',
      user: { app_metadata: { roles: ['editor', 'admin'] } },
    } as any);
    mockedCreateSport.mockResolvedValue({
      id: 'sport-2',
      code: 'bike',
      name: 'Cycling',
      description: null,
      consolidated: null,
    } as any);

    const response = await POST({
      request: makeRequest({ code: 'bike', name: 'Cycling' }),
      locals,
    } as any);

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.name).toBe('Cycling');
  });
});

