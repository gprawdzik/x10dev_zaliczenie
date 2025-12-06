import { afterEach, beforeAll, describe, expect, it, vi, type MockedFunction } from 'vitest';
import type { User } from '@supabase/supabase-js';

import { requireAuth, type RequireAuthResult } from '@/middleware/requireAuth';
import { createSport } from '@/services/sports/createSport';
import type { SportDto } from '@/types';

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

const makeUser = (appMetadata: Record<string, unknown>): User =>
  ({
    id: 'test-user',
    app_metadata: appMetadata,
    aud: 'authenticated',
    role: 'authenticated',
  } as unknown as User);

const makeContext = (body: unknown) =>
  ({
    request: makeRequest(body),
    locals: { supabase: {} },
  } satisfies Parameters<(typeof import('../sports.js'))['POST']>[0]);

describe('POST /api/sports admin guard', () => {
  const mockedRequireAuth = requireAuth as MockedFunction<typeof requireAuth>;
  const mockedCreateSport = createSport as MockedFunction<typeof createSport>;

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('allows admin users to create a sport', async () => {
    mockedRequireAuth.mockResolvedValue({
      userId: 'user-1',
      accessToken: 'token',
      user: makeUser({ role: 'admin' }),
    } satisfies RequireAuthResult);
    mockedCreateSport.mockResolvedValue({
      id: 'sport-1',
      code: 'run',
      name: 'Running',
      description: null,
      consolidated: null,
    } satisfies SportDto);

    const response = await POST(makeContext({ code: 'run', name: 'Running' }));

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.code).toBe('run');
    expect(mockedCreateSport).toHaveBeenCalledTimes(1);
  });

  it('rejects non-admin users with 403', async () => {
    mockedRequireAuth.mockResolvedValue({
      userId: 'user-2',
      accessToken: 'token',
      user: makeUser({ role: 'user' }),
    } satisfies RequireAuthResult);

    const response = await POST(makeContext({ code: 'run', name: 'Running' }));

    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error.code).toBe('forbidden');
    expect(mockedCreateSport).not.toHaveBeenCalled();
  });

  it('accepts roles array containing admin', async () => {
    mockedRequireAuth.mockResolvedValue({
      userId: 'user-3',
      accessToken: 'token',
      user: makeUser({ roles: ['editor', 'admin'] }),
    } satisfies RequireAuthResult);
    mockedCreateSport.mockResolvedValue({
      id: 'sport-2',
      code: 'bike',
      name: 'Cycling',
      description: null,
      consolidated: null,
    } satisfies SportDto);

    const response = await POST(makeContext({ code: 'bike', name: 'Cycling' }));

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.name).toBe('Cycling');
  });
});

