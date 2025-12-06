import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, TablesInsert } from '../db/database.types.js';
import { supabaseClient } from '../db/supabase.client.js';
import type { ActivityDto, GenerateActivitiesResponse, Paginated, SportDto } from '../types.js';
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

type SportProfile = {
  code: string;
  type: string;
  displayName: string;
  distanceKmRange: [number, number];
  speedKphRange: [number, number];
  elevationRange: [number, number];
};

type GeneratorConfig = {
  timezone: string;
  profiles: SportProfile[];
  distribution: DistributionConfig;
  total: number;
  targetYear?: number;
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
const DEFAULT_DISTRIBUTION: DistributionConfig = {
  primary: 0.5,
  secondary: 0.3,
  tertiary: 0.15,
  quaternary: 0.05,
};
const TOTAL_SYNTHETIC_ACTIVITIES = 100;
const WEEKDAY_ACTIVE_HOURS: [number, number] = [16, 21];
const WEEKEND_ACTIVE_HOURS: [number, number] = [7, 19];

const DEFAULT_SPORT_PROFILE: SportProfile = {
  code: 'workout',
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
  sports: SportDto[],
  overrides: GenerateActivitiesOverrides = {},
  options?: { supabase?: ActivitiesSupabaseClient }
): Promise<GenerateActivitiesResponse> {
  if (!userId) {
    throw new ActivitiesServiceError(
      ActivitiesServiceErrors.VALIDATION_ERROR,
      'userId is required to generate activities'
    );
  }

  if (!sports || sports.length === 0) {
    throw new ActivitiesServiceError(
      ActivitiesServiceErrors.VALIDATION_ERROR,
      'At least one sport is required to generate activities'
    );
  }

  const client = options?.supabase ?? supabaseClient;
  if (!client) {
    throw new ActivitiesServiceError(
      ActivitiesServiceErrors.CLIENT_UNAVAILABLE,
      'Supabase client is not initialized'
    );
  }

  const config = resolveGeneratorConfig(sports, overrides);
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

function resolveGeneratorConfig(sports: SportDto[], overrides: GenerateActivitiesOverrides = {}): GeneratorConfig {
  const timezone = (overrides.timezone ?? DEFAULT_TIMEZONE).trim() || DEFAULT_TIMEZONE;
  const distribution = normalizeDistribution(overrides.distribution ?? DEFAULT_DISTRIBUTION);
  const targetYear = overrides.year;
  
  // Build profiles from SportDto array
  const profiles = sports.map(sport => buildSportProfile(sport));
  
  // Ensure we have exactly 4 profiles for distribution
  const finalProfiles = ensureFourProfiles(profiles);

  return {
    timezone,
    profiles: finalProfiles,
    distribution,
    total: TOTAL_SYNTHETIC_ACTIVITIES,
    targetYear,
  };
}

function buildSportProfile(sport: SportDto): SportProfile {
  // Extract profile data from consolidated field if available
  const consolidated = sport.consolidated as Record<string, unknown> | null;
  
  const distanceKmRange = extractRange(consolidated?.distanceKmRange, [3, 10]);
  const speedKphRange = extractRange(consolidated?.speedKphRange, [4, 8]);
  const elevationRange = extractRange(consolidated?.elevationRange, [0, 200]);
  const type = (consolidated?.type as string) ?? 'Workout';

  return {
    code: sport.code,
    type,
    displayName: sport.name,
    distanceKmRange,
    speedKphRange,
    elevationRange,
  };
}

function extractRange(value: unknown, defaultRange: [number, number]): [number, number] {
  if (Array.isArray(value) && value.length === 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
    return [value[0], value[1]];
  }
  return defaultRange;
}

function ensureFourProfiles(profiles: SportProfile[]): SportProfile[] {
  if (profiles.length === 0) {
    return [DEFAULT_SPORT_PROFILE, DEFAULT_SPORT_PROFILE, DEFAULT_SPORT_PROFILE, DEFAULT_SPORT_PROFILE];
  }
  
  if (profiles.length >= 4) {
    return profiles.slice(0, 4);
  }
  
  // If we have less than 4, repeat existing profiles to fill slots
  const result = [...profiles];
  while (result.length < 4) {
    result.push(profiles[result.length % profiles.length]);
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
  const baseDate = pickRandomDateWithinYear(config.targetYear);
  const localized = buildLocalizedTimestamp(baseDate, config.timezone);
  const profile = pickSportProfile(config);
  const metrics = buildMetrics(profile, getSeasonalityMultiplier(localized.month));

  return {
    user_id: userId,
    name: buildActivityName(profile.displayName, localized.localHour),
    type: profile.type,
    sport_type: profile.code,
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

function pickRandomDateWithinYear(targetYear?: number): Date {
  if (!targetYear) {
    const now = Date.now();
    const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
    const timestamp = oneYearAgo + Math.random() * (now - oneYearAgo);
    return new Date(timestamp);
  }

  const start = Date.UTC(targetYear, 0, 1);
  const end = Date.UTC(targetYear + 1, 0, 1);
  const timestamp = start + Math.random() * (end - start);
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

function pickSportProfile(config: GeneratorConfig): SportProfile {
  const weights: Array<{ profile: SportProfile; weight: number }> = [
    { profile: config.profiles[0], weight: config.distribution.primary },
    { profile: config.profiles[1], weight: config.distribution.secondary },
    { profile: config.profiles[2], weight: config.distribution.tertiary },
    { profile: config.profiles[3], weight: config.distribution.quaternary },
  ];

  const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0) || 1;
  const threshold = Math.random() * totalWeight;
  let accumulator = 0;

  for (const bucket of weights) {
    accumulator += bucket.weight;
    if (threshold <= accumulator) {
      return bucket.profile;
    }
  }

  return weights[weights.length - 1].profile;
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

