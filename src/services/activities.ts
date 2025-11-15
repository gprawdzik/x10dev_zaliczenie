import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, TablesInsert } from '../db/database.types.js';
import { supabaseClient } from '../db/supabase.client.js';
import type { ActivityDto, GenerateActivitiesResponse, Paginated } from '../types.js';
import type { GenerateActivitiesOverrides, ListActivitiesQuery } from '../validators/activity.js';

export const ActivitiesServiceErrors = {
  CLIENT_UNAVAILABLE: 'activities_client_unavailable',
  DATABASE_ERROR: 'activities_database_error',
  VALIDATION_ERROR: 'activities_validation_error',
} as const;

export class ActivitiesServiceError extends Error {
  constructor(
    public code: (typeof ActivitiesServiceErrors)[keyof typeof ActivitiesServiceErrors] | string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ActivitiesServiceError';
  }
}

type ActivitiesSupabaseClient = SupabaseClient<Database>;
type ActivityInsert = TablesInsert<'activities'>;

type DistributionConfig = {
  primary: number;
  secondary: number;
  tertiary: number;
  quaternary: number;
};

type GeneratorConfig = {
  timezone: string;
  sports: string[];
  distribution: DistributionConfig;
  total: number;
};

type SportProfile = {
  type: string;
  displayName: string;
  distanceKmRange: [number, number];
  speedKphRange: [number, number];
  elevationRange: [number, number];
};

type LocalDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number;
};

type LocalizedTimestamp = {
  utcDate: Date;
  startDateLocal: string;
  utcOffsetMinutes: number;
  localHour: number;
  month: number;
};

const DEFAULT_TIMEZONE = 'Europe/Warsaw';
const DEFAULT_SPORTS = ['running', 'cycling', 'swimming', 'hiking'] as const;
const DEFAULT_DISTRIBUTION: DistributionConfig = {
  primary: 0.5,
  secondary: 0.3,
  tertiary: 0.15,
  quaternary: 0.05,
};
const TOTAL_SYNTHETIC_ACTIVITIES = 100;
const WEEKDAY_ACTIVE_HOURS: [number, number] = [16, 21];
const WEEKEND_ACTIVE_HOURS: [number, number] = [7, 19];

const SPORT_PROFILES: Record<string, SportProfile> = {
  running: {
    type: 'Run',
    displayName: 'Run',
    distanceKmRange: [3, 24],
    speedKphRange: [8.5, 15.5],
    elevationRange: [20, 450],
  },
  cycling: {
    type: 'Ride',
    displayName: 'Ride',
    distanceKmRange: [15, 120],
    speedKphRange: [22, 36],
    elevationRange: [50, 1200],
  },
  swimming: {
    type: 'Swim',
    displayName: 'Swim',
    distanceKmRange: [0.6, 4],
    speedKphRange: [2, 5],
    elevationRange: [0, 25],
  },
  hiking: {
    type: 'Hike',
    displayName: 'Hike',
    distanceKmRange: [4, 25],
    speedKphRange: [3, 6],
    elevationRange: [120, 1500],
  },
  walking: {
    type: 'Walk',
    displayName: 'Walk',
    distanceKmRange: [2, 12],
    speedKphRange: [3, 6],
    elevationRange: [0, 200],
  },
  sup: {
    type: 'StandUpPaddle',
    displayName: 'SUP',
    distanceKmRange: [2, 10],
    speedKphRange: [4, 8],
    elevationRange: [0, 50],
  },
  pilates: {
    type: 'Workout',
    displayName: 'Pilates',
    distanceKmRange: [1, 3],
    speedKphRange: [3, 5],
    elevationRange: [0, 20],
  },
  'strength_training': {
    type: 'Workout',
    displayName: 'Strength',
    distanceKmRange: [1, 4],
    speedKphRange: [1, 4],
    elevationRange: [0, 40],
  },
};

const FALLBACK_PROFILE: SportProfile = {
  type: 'Workout',
  displayName: 'Workout',
  distanceKmRange: [3, 10],
  speedKphRange: [4, 8],
  elevationRange: [0, 200],
};

export async function listActivities(
  userId: string,
  params: ListActivitiesQuery,
  options?: { supabase?: ActivitiesSupabaseClient }
): Promise<Paginated<ActivityDto>> {
  if (!userId) {
    throw new ActivitiesServiceError(
      ActivitiesServiceErrors.VALIDATION_ERROR,
      'userId is required to fetch activities'
    );
  }

  const client = options?.supabase ?? supabaseClient;
  if (!client) {
    throw new ActivitiesServiceError(
      ActivitiesServiceErrors.CLIENT_UNAVAILABLE,
      'Supabase client is not initialized'
    );
  }

  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const sortBy = params.sort_by ?? 'start_date';
  const sortDir = params.sort_dir ?? 'desc';

  const rangeStart = (page - 1) * limit;
  const rangeEnd = rangeStart + limit - 1;

  let query = client
    .from('activities')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);

  if (params.from) {
    query = query.gte('start_date', params.from);
  }
  if (params.to) {
    query = query.lte('start_date', params.to);
  }
  if (params.sport_type) {
    query = query.eq('sport_type', params.sport_type);
  }
  if (params.type) {
    query = query.eq('type', params.type);
  }

  query = query.order(sortBy, { ascending: sortDir === 'asc' }).range(rangeStart, rangeEnd);

  const { data, error, count } = await query;

  if (error) {
    console.error('Failed to list activities:', error);
    throw new ActivitiesServiceError(
      ActivitiesServiceErrors.DATABASE_ERROR,
      'Unable to fetch activities for the current user',
      { originalError: error.message }
    );
  }

  return {
    data: (data ?? []) as ActivityDto[],
    page,
    limit,
    total: count ?? 0,
  };
}

export async function generateActivities(
  userId: string,
  overrides: GenerateActivitiesOverrides = {},
  options?: { supabase?: ActivitiesSupabaseClient }
): Promise<GenerateActivitiesResponse> {
  if (!userId) {
    throw new ActivitiesServiceError(
      ActivitiesServiceErrors.VALIDATION_ERROR,
      'userId is required to generate activities'
    );
  }

  const client = options?.supabase ?? supabaseClient;
  if (!client) {
    throw new ActivitiesServiceError(
      ActivitiesServiceErrors.CLIENT_UNAVAILABLE,
      'Supabase client is not initialized'
    );
  }

  const config = resolveGeneratorConfig(overrides);
  const activities = buildSyntheticActivities(userId, config);

  const { error } = await client.from('activities').insert(activities);

  if (error) {
    console.error('Failed to generate activities:', error);
    throw new ActivitiesServiceError(
      ActivitiesServiceErrors.DATABASE_ERROR,
      'Unable to generate activities for the current user',
      { originalError: error.message }
    );
  }

  return { created_count: activities.length };
}

function resolveGeneratorConfig(overrides: GenerateActivitiesOverrides = {}): GeneratorConfig {
  const sanitizedSports = deduplicateSports(
    (overrides.primary_sports ?? Array.from(DEFAULT_SPORTS)).map((sport) => sport.trim().toLowerCase())
  );
  const sports = ensureSportSlots(sanitizedSports, Array.from(DEFAULT_SPORTS));
  const timezone = (overrides.timezone ?? DEFAULT_TIMEZONE).trim() || DEFAULT_TIMEZONE;
  const distribution = normalizeDistribution(overrides.distribution ?? DEFAULT_DISTRIBUTION);

  return {
    timezone,
    sports,
    distribution,
    total: TOTAL_SYNTHETIC_ACTIVITIES,
  };
}

function deduplicateSports(sports: string[]): string[] {
  return Array.from(new Set(sports.filter(Boolean)));
}

function ensureSportSlots(sports: string[], fallbacks: string[]): string[] {
  const result = [...sports];
  let fallbackIndex = 0;
  while (result.length < 4) {
    const fallback = fallbacks[fallbackIndex % fallbacks.length];
    if (!result.includes(fallback)) {
      result.push(fallback);
    }
    fallbackIndex += 1;
  }

  if (result.length > 4) {
    return result.slice(0, 4);
  }

  return result;
}

function normalizeDistribution(dist: DistributionConfig): DistributionConfig {
  const sum = dist.primary + dist.secondary + dist.tertiary + dist.quaternary;
  if (!sum) {
    return { ...DEFAULT_DISTRIBUTION };
  }

  return {
    primary: dist.primary / sum,
    secondary: dist.secondary / sum,
    tertiary: dist.tertiary / sum,
    quaternary: dist.quaternary / sum,
  };
}

function buildSyntheticActivities(userId: string, config: GeneratorConfig): ActivityInsert[] {
  return Array.from({ length: config.total }, () => createSyntheticActivity(userId, config));
}

function createSyntheticActivity(userId: string, config: GeneratorConfig): ActivityInsert {
  const baseDate = pickRandomDateWithinYear();
  const localized = buildLocalizedTimestamp(baseDate, config.timezone);
  const sportType = pickSportType(config);
  const profile = SPORT_PROFILES[sportType] ?? buildFallbackProfile(sportType);
  const metrics = buildMetrics(profile, getSeasonalityMultiplier(localized.month));

  return {
    user_id: userId,
    name: buildActivityName(profile.displayName, localized.localHour),
    type: profile.type,
    sport_type: sportType,
    start_date: localized.utcDate.toISOString(),
    start_date_local: localized.startDateLocal,
    timezone: config.timezone,
    utc_offset: localized.utcOffsetMinutes * 60,
    distance: metrics.distance,
    moving_time: metrics.movingInterval,
    elapsed_time: metrics.elapsedInterval,
    total_elevation_gain: metrics.elevation,
    average_speed: metrics.averageSpeed,
  };
}

function pickRandomDateWithinYear(): Date {
  const now = Date.now();
  const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
  const timestamp = oneYearAgo + Math.random() * (now - oneYearAgo);
  return new Date(timestamp);
}

function buildLocalizedTimestamp(date: Date, timeZone: string): LocalizedTimestamp {
  const parts = getLocalDateParts(date, timeZone);
  const isWeekend = parts.weekday === 0 || parts.weekday === 6;
  const hourBounds = isWeekend ? WEEKEND_ACTIVE_HOURS : WEEKDAY_ACTIVE_HOURS;
  const adjustedParts: LocalDateParts = {
    ...parts,
    hour: randomInt(hourBounds[0], hourBounds[1]),
    minute: randomInt(0, 59),
    second: randomInt(0, 59),
  };

  const { utcDate, offsetMinutes } = convertLocalPartsToUtc(adjustedParts, timeZone);
  const startDateLocal = formatLocalIso(adjustedParts, offsetMinutes);

  return {
    utcDate,
    startDateLocal,
    utcOffsetMinutes: offsetMinutes,
    localHour: adjustedParts.hour,
    month: adjustedParts.month,
  };
}

function getLocalDateParts(date: Date, timeZone: string): LocalDateParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
    weekday: weekdayMap[map.weekday] ?? 0,
  };
}

function convertLocalPartsToUtc(parts: LocalDateParts, timeZone: string): { utcDate: Date; offsetMinutes: number } {
  const baseUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  const guessDate = new Date(baseUtc);
  let offsetMinutes = getTimeZoneOffsetMinutes(guessDate, timeZone);
  let utcTimestamp = baseUtc - offsetMinutes * 60 * 1000;
  let utcDate = new Date(utcTimestamp);

  const correctedOffset = getTimeZoneOffsetMinutes(utcDate, timeZone);
  if (correctedOffset !== offsetMinutes) {
    offsetMinutes = correctedOffset;
    utcTimestamp = baseUtc - offsetMinutes * 60 * 1000;
    utcDate = new Date(utcTimestamp);
  }

  return { utcDate, offsetMinutes };
}

function getTimeZoneOffsetMinutes(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }

  const zonedUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second)
  );

  return Math.round((zonedUtc - date.getTime()) / 60000);
}

function formatLocalIso(parts: LocalDateParts, offsetMinutes: number): string {
  const yyyy = parts.year.toString().padStart(4, '0');
  const mm = parts.month.toString().padStart(2, '0');
  const dd = parts.day.toString().padStart(2, '0');
  const hh = parts.hour.toString().padStart(2, '0');
  const min = parts.minute.toString().padStart(2, '0');
  const ss = parts.second.toString().padStart(2, '0');
  const offset = formatOffset(offsetMinutes);
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}${offset}`;
}

function formatOffset(minutes: number): string {
  const sign = minutes >= 0 ? '+' : '-';
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60)
    .toString()
    .padStart(2, '0');
  const mins = (abs % 60).toString().padStart(2, '0');
  return `${sign}${hours}:${mins}`;
}

function pickSportType(config: GeneratorConfig): string {
  const weights: Array<{ sport: string; weight: number }> = [
    { sport: config.sports[0], weight: config.distribution.primary },
    { sport: config.sports[1], weight: config.distribution.secondary },
    { sport: config.sports[2], weight: config.distribution.tertiary },
    { sport: config.sports[3], weight: config.distribution.quaternary },
  ];

  const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0) || 1;
  const threshold = Math.random() * totalWeight;
  let accumulator = 0;

  for (const bucket of weights) {
    accumulator += bucket.weight;
    if (threshold <= accumulator) {
      return bucket.sport;
    }
  }

  return weights[weights.length - 1].sport;
}

function buildFallbackProfile(code: string): SportProfile {
  const normalized = code.replace(/[_-]/g, ' ');
  const title = normalized
    .split(' ')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

  return {
    ...FALLBACK_PROFILE,
    displayName: title || FALLBACK_PROFILE.displayName,
  };
}

function buildMetrics(profile: SportProfile, seasonality: number) {
  const distanceKm = clamp(
    randomBetween(profile.distanceKmRange[0], profile.distanceKmRange[1]) * seasonality,
    profile.distanceKmRange[0] * 0.5,
    profile.distanceKmRange[1] * 1.25
  );
  const distanceMeters = Math.max(100, Math.round(distanceKm * 1000));

  const speedKph = randomBetween(profile.speedKphRange[0], profile.speedKphRange[1]);
  const movingSeconds = Math.max(300, Math.round((distanceKm / speedKph) * 3600));
  const elapsedSeconds = movingSeconds + randomInt(60, 900);

  const elevation = Math.max(
    0,
    Math.round(
      clamp(
        randomBetween(profile.elevationRange[0], profile.elevationRange[1]) * seasonality,
        0,
        profile.elevationRange[1] * 1.25
      )
    )
  );

  const averageSpeed = Number((distanceMeters / movingSeconds).toFixed(2));

  return {
    distance: distanceMeters,
    movingInterval: formatInterval(movingSeconds),
    elapsedInterval: formatInterval(elapsedSeconds),
    elevation,
    averageSpeed,
  };
}

function getSeasonalityMultiplier(month: number): number {
  if ([12, 1, 2].includes(month)) {
    return 0.7;
  }
  if ([3, 4, 5].includes(month)) {
    return 0.9;
  }
  if ([6, 7, 8].includes(month)) {
    return 1.1;
  }
  return 1.0;
}

function buildActivityName(baseName: string, hour: number): string {
  const timeOfDay =
    hour < 9 ? 'Morning' : hour < 13 ? 'Lunch' : hour < 18 ? 'Afternoon' : 'Evening';
  return `${timeOfDay} ${baseName}`.trim();
}

function formatInterval(seconds: number): string {
  return `${seconds} seconds`;
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

