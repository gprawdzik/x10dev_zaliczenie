import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, Tables } from '../db/database.types.js';
import type {
  ProgressAnnualRequest,
  ProgressAnnualResponse,
  ProgressAnnualSeries,
} from '../types.js';

export const ProgressServiceErrors = {
  CLIENT_UNAVAILABLE: 'PROGRESS_CLIENT_UNAVAILABLE',
  VALIDATION_ERROR: 'PROGRESS_VALIDATION_ERROR',
  NOT_FOUND: 'PROGRESS_NOT_FOUND',
  DATABASE_ERROR: 'PROGRESS_DATABASE_ERROR',
} as const;

export class ProgressServiceError extends Error {
  constructor(
    public code: (typeof ProgressServiceErrors)[keyof typeof ProgressServiceErrors] | string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ProgressServiceError';
  }
}

type ProgressSupabaseClient = SupabaseClient<Database>;
type ActivityMetricRow = Pick<
  Tables<'activities'>,
  'start_date' | 'distance' | 'moving_time' | 'total_elevation_gain' | 'sport_type'
>;

type GetAnnualProgressOptions = {
  supabase?: ProgressSupabaseClient;
};

export async function getAnnualProgress(
  userId: string,
  params: ProgressAnnualRequest,
  options?: GetAnnualProgressOptions
): Promise<ProgressAnnualResponse> {
  assertUserId(userId);
  const client = await resolveClient(options);
  const { year, metric_type, sport_id } = params;
  const scope_type = sport_id ? 'per_sport' : 'global';

  const goalTarget = await resolveGoalTarget(client, userId, metric_type, sport_id);
  const sportCode = sport_id ? await resolveSportCode(client, sport_id) : null;
  const activities = await fetchActivitiesForYear(client, userId, year, sportCode);
  const series = buildCumulativeSeries(activities, metric_type, year);

  return {
    year,
    metric_type,
    scope_type,
    target_value: normalizeTargetValue(metric_type, goalTarget),
    series,
  };
}

export function buildCumulativeSeries(
  activities: ActivityMetricRow[],
  metric: ProgressAnnualRequest['metric_type'],
  year: number,
  today: Date = new Date()
): ProgressAnnualSeries[] {
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const isCurrentYear = year === todayUtc.getUTCFullYear();
  const rangeEndExclusive = isCurrentYear
    ? addDays(todayUtc, 1)
    : new Date(Date.UTC(year + 1, 0, 1));

  const dailyTotals = new Map<string, number>();

  for (const activity of activities) {
    const dateKey = extractDateKey(activity.start_date);
    if (!dateKey) {
      continue;
    }

    const value = extractMetricValue(activity, metric);
    if (!Number.isFinite(value) || value < 0) {
      continue;
    }

    dailyTotals.set(dateKey, (dailyTotals.get(dateKey) ?? 0) + value);
  }

  const series: ProgressAnnualSeries[] = [];
  let cursor = new Date(yearStart);
  let runningTotal = 0;

  while (cursor < rangeEndExclusive) {
    const key = cursor.toISOString().slice(0, 10);
    runningTotal += dailyTotals.get(key) ?? 0;
    series.push({ date: key, value: runningTotal });
    cursor = addDays(cursor, 1);
  }

  return series;
}

function extractMetricValue(
  activity: ActivityMetricRow,
  metric: ProgressAnnualRequest['metric_type']
): number {
  if (metric === 'distance') {
    return toNumber(activity.distance);
  }

  if (metric === 'time') {
    return parseIntervalToSeconds(activity.moving_time);
  }

  return toNumber(activity.total_elevation_gain);
}

function extractDateKey(dateString: string | null): string | null {
  if (!dateString) {
    return null;
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function parseIntervalToSeconds(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value !== 'string') {
    return 0;
  }

  const trimmed = value.trim();

  // Format HH:MM:SS (Postgres interval text)
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':').map(Number);
    if (parts.length === 3 && parts.every((part) => Number.isFinite(part))) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
  }

  // ISO 8601 duration "PT123S"
  if (/^P(T.*)?/i.test(trimmed) && trimmed.toUpperCase().includes('S')) {
    const match = trimmed.match(/(\d+(?:\.\d+)?)S/i);
    if (match?.[1]) {
      return Number(match[1]);
    }
  }

  // Generic "<number> seconds" or any leading numeric value
  const numericMatch = trimmed.match(/-?\d+(?:\.\d+)?/);
  if (numericMatch?.[0]) {
    const parsed = Number(numericMatch[0]);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

async function fetchActivitiesForYear(
  client: ProgressSupabaseClient,
  userId: string,
  year: number,
  sportCode: string | null
): Promise<ActivityMetricRow[]> {
  const rangeStart = new Date(Date.UTC(year, 0, 1)).toISOString();
  const rangeEnd = new Date(Date.UTC(year + 1, 0, 1)).toISOString();

  let query = client
    .from('activities')
    .select('start_date,distance,moving_time,total_elevation_gain,sport_type')
    .eq('user_id', userId)
    .gte('start_date', rangeStart)
    .lt('start_date', rangeEnd);

  if (sportCode) {
    query = query.eq('sport_type', sportCode);
  }

  query = query.order('start_date', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch activities for progress calculation:', error);
    throw new ProgressServiceError(
      ProgressServiceErrors.DATABASE_ERROR,
      'Unable to load activities for progress',
      { originalError: error.message }
    );
  }

  return (data ?? []) as ActivityMetricRow[];
}

async function resolveSportCode(client: ProgressSupabaseClient, sportId: string): Promise<string> {
  const { data, error } = await client.from('sports').select('code').eq('id', sportId).single();

  if (error || !data) {
    throw new ProgressServiceError(
      ProgressServiceErrors.VALIDATION_ERROR,
      'sport_id must reference an existing sport',
      { sportId, originalError: error?.message }
    );
  }

  return data.code;
}

async function resolveClient(
  options?: GetAnnualProgressOptions
): Promise<ProgressSupabaseClient> {
  if (options?.supabase) {
    return options.supabase;
  }

  if (cachedSupabaseClient) {
    return cachedSupabaseClient;
  }

  try {
    const module = await import('../db/supabase.client.js');
    cachedSupabaseClient = module.supabaseClient as ProgressSupabaseClient;
    if (!cachedSupabaseClient) {
      throw new ProgressServiceError(
        ProgressServiceErrors.CLIENT_UNAVAILABLE,
        'Supabase client is not initialized'
      );
    }
    return cachedSupabaseClient;
  } catch (error) {
    throw new ProgressServiceError(
      ProgressServiceErrors.CLIENT_UNAVAILABLE,
      'Supabase client is not initialized',
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

function assertUserId(userId: string): void {
  if (!userId) {
    throw new ProgressServiceError(
      ProgressServiceErrors.VALIDATION_ERROR,
      'userId is required to load progress'
    );
  }
}

async function resolveGoalTarget(
  client: ProgressSupabaseClient,
  userId: string,
  metric: ProgressAnnualRequest['metric_type'],
  sportId: string | null
): Promise<number> {
  const scope = sportId ? 'per_sport' : 'global';

  let query = client
    .from('goals')
    .select('target_value')
    .eq('user_id', userId)
    .eq('metric_type', metric)
    .eq('scope_type', scope);

  if (sportId) {
    query = query.eq('sport_id', sportId);
  } else {
    query = query.is('sport_id', null);
  }

  const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) {
    console.error('Failed to resolve goal target for progress', error);
    return 0;
  }

  return data?.target_value ?? 0;
}

function normalizeTargetValue(
  metric: ProgressAnnualRequest['metric_type'],
  value: number | null | undefined
): number {
  if (!Number.isFinite(value ?? 0)) {
    return 0;
  }

  if (metric === 'time') {
    // Stored in hours; convert to seconds to match activity series
    return (value ?? 0) * 3600;
  }

  return value ?? 0;
}

let cachedSupabaseClient: ProgressSupabaseClient | null = null;

