import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../../db/database.types.js';
import { supabaseClient } from '../../db/supabase.client.js';
import type {
  CreateGoalDto,
  GoalDto,
  GoalHistoryDto,
  Paginated,
  UpdateGoalDto,
} from '../../types.js';
import type { GoalHistoryQuery, GoalsQuery } from '../../validators/goals.js';

export const GoalsServiceErrors = {
  CLIENT_UNAVAILABLE: 'GOALS_CLIENT_UNAVAILABLE',
  VALIDATION_ERROR: 'GOALS_VALIDATION_ERROR',
  DATABASE_ERROR: 'GOALS_DATABASE_ERROR',
  NOT_FOUND: 'GOALS_NOT_FOUND',
  CONFLICT: 'GOALS_CONFLICT',
  FORBIDDEN: 'GOALS_FORBIDDEN',
} as const;

export class GoalsServiceError extends Error {
  constructor(
    public code: (typeof GoalsServiceErrors)[keyof typeof GoalsServiceErrors] | string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'GoalsServiceError';
  }
}

type GoalsSupabaseClient = SupabaseClient<Database>;

type ServiceOptions = {
  supabase?: GoalsSupabaseClient;
};

export async function listGoals(
  userId: string,
  params: GoalsQuery,
  options?: ServiceOptions
): Promise<Paginated<GoalDto>> {
  assertUserId(userId);
  const client = resolveClient(options);

  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const { rangeStart, rangeEnd } = buildRange(page, limit);

  let query = client
    .from('goals')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);

  if (params.year) {
    query = query.eq('year', params.year);
  }
  if (params.scope_type) {
    query = query.eq('scope_type', params.scope_type);
  }
  if (params.metric_type) {
    query = query.eq('metric_type', params.metric_type);
  }
  if (params.sport_id) {
    query = query.eq('sport_id', params.sport_id);
  }

  query = query
    .order(params.sort_by ?? 'created_at', { ascending: params.sort_dir === 'asc' })
    .range(rangeStart, rangeEnd);

  const { data, error, count } = await query;

  if (error) {
    console.error('Failed to list goals:', error);
    throw new GoalsServiceError(
      GoalsServiceErrors.DATABASE_ERROR,
      'Unable to load goals for the current user',
      { originalError: error.message }
    );
  }

  return {
    data: (data ?? []) as GoalDto[],
    page,
    limit,
    total: count ?? 0,
  };
}

export async function getGoal(userId: string, goalId: string, options?: ServiceOptions): Promise<GoalDto> {
  assertUserId(userId);
  if (!goalId) {
    throw new GoalsServiceError(
      GoalsServiceErrors.VALIDATION_ERROR,
      'goalId is required to fetch a goal'
    );
  }

  const client = resolveClient(options);

  const { data, error } = await client
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .eq('id', goalId)
    .single();

  if (error) {
    if (isNoRowsError(error)) {
      throw new GoalsServiceError(GoalsServiceErrors.NOT_FOUND, 'Goal not found', { goalId });
    }

    console.error('Failed to fetch goal:', error);
    throw new GoalsServiceError(GoalsServiceErrors.DATABASE_ERROR, 'Unable to fetch goal details', {
      originalError: error.message,
    });
  }

  return data as GoalDto;
}

export async function createGoal(
  userId: string,
  payload: CreateGoalDto,
  options?: ServiceOptions
): Promise<GoalDto> {
  assertUserId(userId);
  const client = resolveClient(options);

  const insertPayload = {
    ...payload,
    user_id: userId,
  };

  const { data, error } = await client.from('goals').insert(insertPayload).select().single();

  if (error) {
    if (isConflictError(error)) {
      throw new GoalsServiceError(
        GoalsServiceErrors.CONFLICT,
        'A similar goal already exists for the selected year and metric',
        { originalError: error.message }
      );
    }

    if (isPermissionError(error)) {
      throw new GoalsServiceError(
        GoalsServiceErrors.FORBIDDEN,
        'You are not allowed to create goals',
        { originalError: error.message }
      );
    }

    console.error('Failed to create goal:', error);
    throw new GoalsServiceError(GoalsServiceErrors.DATABASE_ERROR, 'Unable to create goal right now', {
      originalError: error.message,
    });
  }

  if (!data) {
    throw new GoalsServiceError(
      GoalsServiceErrors.DATABASE_ERROR,
      'Goal was created but no data was returned by the database'
    );
  }

  return data as GoalDto;
}

export async function updateGoal(
  userId: string,
  goalId: string,
  updates: UpdateGoalDto,
  options?: ServiceOptions
): Promise<GoalDto> {
  assertUserId(userId);
  if (!goalId) {
    throw new GoalsServiceError(
      GoalsServiceErrors.VALIDATION_ERROR,
      'goalId is required to update a goal'
    );
  }

  if (!updates || Object.keys(updates).length === 0) {
    throw new GoalsServiceError(
      GoalsServiceErrors.VALIDATION_ERROR,
      'At least one field must be provided to update a goal'
    );
  }

  const client = resolveClient(options);

  const { data, error } = await client
    .from('goals')
    .update(updates)
    .eq('user_id', userId)
    .eq('id', goalId)
    .select()
    .single();

  if (error) {
    if (isNoRowsError(error)) {
      throw new GoalsServiceError(GoalsServiceErrors.NOT_FOUND, 'Goal not found', { goalId });
    }

    if (isPermissionError(error)) {
      throw new GoalsServiceError(
        GoalsServiceErrors.FORBIDDEN,
        'You are not allowed to update this goal',
        { goalId }
      );
    }

    console.error('Failed to update goal:', error);
    throw new GoalsServiceError(
      GoalsServiceErrors.DATABASE_ERROR,
      'Unable to update goal right now',
      { originalError: error.message }
    );
  }

  if (!data) {
    throw new GoalsServiceError(
      GoalsServiceErrors.DATABASE_ERROR,
      'Goal was updated but no data was returned'
    );
  }

  return data as GoalDto;
}

export async function deleteGoal(userId: string, goalId: string, options?: ServiceOptions): Promise<void> {
  assertUserId(userId);
  if (!goalId) {
    throw new GoalsServiceError(
      GoalsServiceErrors.VALIDATION_ERROR,
      'goalId is required to delete a goal'
    );
  }

  const client = resolveClient(options);

  const { data, error } = await client
    .from('goals')
    .delete()
    .eq('user_id', userId)
    .eq('id', goalId)
    .select('id')
    .single();

  if (error) {
    if (isNoRowsError(error)) {
      throw new GoalsServiceError(GoalsServiceErrors.NOT_FOUND, 'Goal not found', { goalId });
    }

    if (isPermissionError(error)) {
      throw new GoalsServiceError(
        GoalsServiceErrors.FORBIDDEN,
        'You are not allowed to delete this goal',
        { goalId }
      );
    }

    console.error('Failed to delete goal:', error);
    throw new GoalsServiceError(
      GoalsServiceErrors.DATABASE_ERROR,
      'Unable to delete goal right now',
      { originalError: error.message }
    );
  }

  if (!data) {
    throw new GoalsServiceError(GoalsServiceErrors.NOT_FOUND, 'Goal not found', { goalId });
  }
}

export async function listGoalHistory(
  userId: string,
  params: GoalHistoryQuery,
  options?: ServiceOptions
): Promise<Paginated<GoalHistoryDto>> {
  assertUserId(userId);
  const client = resolveClient(options);

  // Ensure the goal belongs to the user before exposing its history
  await getGoal(userId, params.goal_id, options);

  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const { rangeStart, rangeEnd } = buildRange(page, limit);

  let query = client
    .from('goal_history')
    .select('*', { count: 'exact' })
    .eq('goal_id', params.goal_id);

  query = query
    .order(params.sort_by ?? 'changed_at', { ascending: params.sort_dir === 'asc' })
    .range(rangeStart, rangeEnd);

  const { data, error, count } = await query;

  if (error) {
    console.error('Failed to list goal history:', error);
    throw new GoalsServiceError(
      GoalsServiceErrors.DATABASE_ERROR,
      'Unable to load goal history',
      { originalError: error.message }
    );
  }

  return {
    data: (data ?? []) as GoalHistoryDto[],
    page,
    limit,
    total: count ?? 0,
  };
}

function resolveClient(options?: ServiceOptions): GoalsSupabaseClient {
  const client = options?.supabase ?? supabaseClient;
  if (!client) {
    throw new GoalsServiceError(
      GoalsServiceErrors.CLIENT_UNAVAILABLE,
      'Supabase client is not initialized'
    );
  }

  return client;
}

function buildRange(page: number, limit: number): { rangeStart: number; rangeEnd: number } {
  const rangeStart = (page - 1) * limit;
  const rangeEnd = rangeStart + limit - 1;
  return { rangeStart, rangeEnd };
}

function assertUserId(userId: string): void {
  if (!userId) {
    throw new GoalsServiceError(
      GoalsServiceErrors.VALIDATION_ERROR,
      'userId is required to perform this operation'
    );
  }
}

type SupabasePostgrestError = {
  code?: string;
  message: string;
};

function isNoRowsError(error: SupabasePostgrestError): boolean {
  return error.code === 'PGRST116' || /no rows/.test(error.message.toLowerCase());
}

function isConflictError(error: SupabasePostgrestError): boolean {
  return error.code === '23505';
}

function isPermissionError(error: SupabasePostgrestError): boolean {
  if (!error.code && !error.message) {
    return false;
  }

  return error.code === 'PGRST301' || /permission|not allowed/i.test(error.message);
}

