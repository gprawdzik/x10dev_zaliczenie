import { computed, onMounted, reactive } from 'vue';

import { parseDurationToSeconds } from '../lib/formatters.js';
import type { ActivityDto, GoalDto, Paginated, SportDto } from '../types.js';

export type ApiState<T> = {
  data: T | null;
  isLoading: boolean;
  error: string | null;
};

export type BreakdownItem = { sport: string; count: number };

export type DashboardMetricsViewModel = {
  totalGoals: number;
  achievedGoals: number;
  activitiesMonth: BreakdownItem[];
  activitiesYear: BreakdownItem[];
};

export type DateRange = { from: string; to: string };

type MetricTotals = { distance: number; time: number; elevation_gain: number };

type ActivityTotals = {
  global: MetricTotals;
  bySport: Record<string, MetricTotals>;
};

type SportLite = {
  id: string;
  code: string;
  name: string;
};

type SportsLookup = {
  byId: Map<string, SportLite>;
  codeToName: Record<string, string>;
};

type SportsState = {
  data: SportLite[] | null;
  isLoading: boolean;
  error: string | null;
};

const DEFAULT_GOAL_LIMIT = 100;
const DEFAULT_ACTIVITIES_LIMIT = 100;
const MAX_ACTIVITY_PAGES = 20; // defensive cap to avoid unbounded loops

export function useDashboardData() {
  const goalsState = reactive<ApiState<GoalDto[]>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const activitiesState = reactive<ApiState<ActivityDto[]>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const sportsState = reactive<SportsState>({
    data: null,
    isLoading: false,
    error: null,
  });

  const currentYear = new Date().getUTCFullYear();
  const currentMonth = new Date().getUTCMonth();

  const metrics = computed<DashboardMetricsViewModel>(() => {
    const goalsList: GoalDto[] = goalsState.data ?? [];
    const activitiesList: ActivityDto[] = activitiesState.data ?? [];
    const sportsList: SportLite[] = sportsState.data ?? [];

    return buildMetrics(goalsList, activitiesList, sportsList, currentYear, currentMonth);
  });

  const errorMessage = computed(() => goalsState.error ?? activitiesState.error ?? sportsState.error);
  const isLoading = computed(
    () => goalsState.isLoading || activitiesState.isLoading || sportsState.isLoading
  );

  async function loadGoals() {
    goalsState.isLoading = true;
    goalsState.error = null;

    try {
      if (typeof window === 'undefined') {
        return;
      }

      const search = new URLSearchParams({
        page: '1',
        limit: String(DEFAULT_GOAL_LIMIT),
        sort_by: 'created_at',
        sort_dir: 'desc',
      });

      const response = await fetch(`/api/goals?${search.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const message = await extractErrorMessage(response, 'Nie udało się załadować celów.');
        throw new Error(message);
      }

      const payload = (await response.json()) as Paginated<GoalDto>;
      goalsState.data = payload.data ?? [];
    } catch (error) {
      console.error('Failed to load goals for dashboard', error);
      goalsState.data = [];
      goalsState.error =
        error instanceof Error ? error.message : 'Nie udało się załadować celów.';
    } finally {
      goalsState.isLoading = false;
    }
  }

  async function loadActivities() {
    activitiesState.isLoading = true;
    activitiesState.error = null;

    try {
      if (typeof window === 'undefined') {
        return;
      }

      const range = buildYearRange(currentYear);
      const collected: ActivityDto[] = [];
      let page = 1;

      while (page <= MAX_ACTIVITY_PAGES) {
        const search = new URLSearchParams({
          from: range.from,
          to: range.to,
          page: String(page),
          limit: String(DEFAULT_ACTIVITIES_LIMIT),
          sort_by: 'start_date',
          sort_dir: 'asc',
        });

        const response = await fetch(`/api/activities?${search.toString()}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          const message = await extractErrorMessage(
            response,
            'Nie udało się załadować aktywności.'
          );
          throw new Error(message);
        }

        const payload = (await response.json()) as Paginated<ActivityDto>;
        const pageData = payload.data ?? [];
        collected.push(...pageData);

        const total = payload.total ?? pageData.length;
        const fetched = collected.length;
        if (pageData.length < DEFAULT_ACTIVITIES_LIMIT || fetched >= total) {
          break;
        }

        page += 1;
      }

      activitiesState.data = collected;
    } catch (error) {
      console.error('Failed to load activities for dashboard', error);
      activitiesState.data = [];
      activitiesState.error =
        error instanceof Error ? error.message : 'Nie udało się załadować aktywności.';
    } finally {
      activitiesState.isLoading = false;
    }
  }

  async function loadSports() {
    sportsState.isLoading = true;
    sportsState.error = null;

    try {
      if (typeof window === 'undefined') {
        return;
      }

      const response = await fetch('/api/sports', {
        credentials: 'include',
      });

      if (!response.ok) {
        const message = await extractErrorMessage(response, 'Nie udało się załadować dyscyplin.');
        throw new Error(message);
      }

      const payload = (await response.json()) as unknown;
      const sportsPayload: SportLite[] = Array.isArray(payload)
        ? (payload as SportDto[])
            .filter((item): item is SportDto => Boolean(item && (item as SportDto).id && (item as SportDto).code))
            .map((item) => ({
              id: item.id,
              code: item.code,
              name: item.name,
            }))
        : [];
      sportsState.data = sportsPayload;
    } catch (error) {
      console.error('Failed to load sports for dashboard', error);
      sportsState.data = [];
      sportsState.error =
        error instanceof Error ? error.message : 'Nie udało się załadować dyscyplin.';
    } finally {
      sportsState.isLoading = false;
    }
  }

  async function load() {
    await Promise.all([loadGoals(), loadActivities(), loadSports()]);
  }

  function retry() {
    return load();
  }

  onMounted(() => {
    void load();
  });

  return {
    goalsState,
    activitiesState,
    sportsState,
    metrics,
    errorMessage,
    isLoading,
    load,
    retry,
  };
}

export function buildMetrics(
  goals: GoalDto[],
  activities: ActivityDto[],
  sports: SportLite[],
  year: number,
  monthIndex: number
): DashboardMetricsViewModel {
  const activitiesForYear = filterActivitiesByYear(activities, year);
  const totals = buildActivityTotals(activitiesForYear);
  const sportsLookup = buildSportsLookup(sports);

  const totalGoals = goals.length;
  const achievedGoals = goals.filter((goal) => isGoalAchieved(goal, totals, sportsLookup)).length;

  const activitiesYear = countBySport(activitiesForYear, sportsLookup.codeToName);
  const activitiesMonth = countBySport(
    activitiesForYear.filter((activity) => isInMonth(activity.start_date, year, monthIndex)),
    sportsLookup.codeToName
  );

  return {
    totalGoals,
    achievedGoals,
    activitiesMonth,
    activitiesYear,
  };
}

export function countBySport(
  activities: ActivityDto[],
  sportNames: Record<string, string> = {}
): BreakdownItem[] {
  const counts = new Map<string, number>();

  for (const activity of activities) {
    const code = normalizeSportCode(activity);
    if (!code) {
      continue;
    }
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }

  const items: BreakdownItem[] = [];
  for (const [code, count] of counts.entries()) {
    const name = sportNames[code];
    const label = name ? `${name} (${code})` : code;
    items.push({ sport: label, count });
  }

  return items.sort((a, b) => b.count - a.count || a.sport.localeCompare(b.sport));
}

export function groupActivitiesBySport(activities: ActivityDto[]): Map<string, ActivityDto[]> {
  const result = new Map<string, ActivityDto[]>();

  for (const activity of activities) {
    const code = normalizeSportCode(activity);
    if (!code) {
      continue;
    }

    if (!result.has(code)) {
      result.set(code, []);
    }

    result.get(code)!.push(activity);
  }

  return result;
}

export function isGoalAchieved(
  goal: GoalDto,
  totals: ActivityTotals,
  sportsLookup: SportsLookup
): boolean {
  if (!goal || !Number.isFinite(goal.target_value) || goal.target_value <= 0) {
    return false;
  }

  const metricKey: keyof MetricTotals =
    goal.metric_type === 'time'
      ? 'time'
      : goal.metric_type === 'elevation_gain'
        ? 'elevation_gain'
        : 'distance';

  const targetValue =
    goal.metric_type === 'time' ? goal.target_value * 3600 : goal.target_value;

  if (goal.scope_type === 'global') {
    const value = totals.global[metricKey] ?? 0;
    return value >= targetValue;
  }

  const preferredCode = resolveSportCode(goal, sportsLookup);
  const fallbackCode = normalizeCode(goal.sport_id ?? '');
  const code =
    (preferredCode && totals.bySport[preferredCode] ? preferredCode : null) ??
    (fallbackCode && totals.bySport[fallbackCode] ? fallbackCode : null);

  if (!code) {
    return false;
  }

  const sportTotals = totals.bySport[code];
  const value = sportTotals?.[metricKey] ?? 0;
  return value >= targetValue;
}

export function buildActivityTotals(activities: ActivityDto[]): ActivityTotals {
  const totals: ActivityTotals = {
    global: { distance: 0, time: 0, elevation_gain: 0 },
    bySport: {},
  };

  for (const activity of activities) {
    const code = normalizeSportCode(activity);
    const metrics = extractMetrics(activity);

    totals.global.distance += metrics.distance;
    totals.global.time += metrics.time;
    totals.global.elevation_gain += metrics.elevation_gain;

    if (!code) {
      continue;
    }

    if (!totals.bySport[code]) {
      totals.bySport[code] = { distance: 0, time: 0, elevation_gain: 0 };
    }

    totals.bySport[code].distance += metrics.distance;
    totals.bySport[code].time += metrics.time;
    totals.bySport[code].elevation_gain += metrics.elevation_gain;
  }

  return totals;
}

function buildSportsLookup(sports: SportLite[]): SportsLookup {
  const byId = new Map<string, SportLite>();
  const codeToName: Record<string, string> = {};

  for (const sport of sports) {
    byId.set(sport.id, sport);
    const normalizedCode = normalizeCode(sport.code);
    if (normalizedCode) {
      codeToName[normalizedCode] = sport.name;
    }
  }

  return { byId, codeToName };
}

function filterActivitiesByYear(activities: ActivityDto[], year: number): ActivityDto[] {
  return activities.filter((activity) => isInYear(activity.start_date, year));
}

function isInYear(dateIso: string | null, year: number): boolean {
  if (!dateIso) {
    return false;
  }
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  return date.getUTCFullYear() === year;
}

function isInMonth(dateIso: string | null, year: number, monthIndex: number): boolean {
  if (!dateIso) {
    return false;
  }
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  return date.getUTCFullYear() === year && date.getUTCMonth() === monthIndex;
}

function normalizeSportCode(activity: ActivityDto): string {
  return normalizeCode(activity.sport_type ?? activity.type);
}

function extractMetrics(activity: ActivityDto): MetricTotals {
  const distance =
    typeof activity.distance === 'number' && Number.isFinite(activity.distance)
      ? activity.distance
      : 0;

  const elevation =
    typeof activity.total_elevation_gain === 'number' &&
    Number.isFinite(activity.total_elevation_gain)
      ? activity.total_elevation_gain
      : 0;

  const time = parseDurationToSeconds(activity.moving_time);

  return {
    distance,
    time,
    elevation_gain: elevation,
  };
}

function resolveSportCode(goal: GoalDto, sportsLookup: SportsLookup): string | null {
  if (goal.scope_type === 'global') {
    return null;
  }

  if (!goal.sport_id) {
    return null;
  }

  const sport = sportsLookup.byId.get(goal.sport_id);
  const code = sport?.code ?? goal.sport_id;
  return normalizeCode(code) || null;
}

async function extractErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as unknown;
    if (
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      payload.error &&
      typeof payload.error === 'object' &&
      'message' in payload.error &&
      typeof payload.error.message === 'string'
    ) {
      return payload.error.message;
    }
  } catch {
    // Ignore parse errors and fall back to default
  }

  return fallback;
}

function buildYearRange(year: number): DateRange {
  return {
    from: `${year}-01-01T00:00:00Z`,
    to: `${year}-12-31T23:59:59Z`,
  };
}

function normalizeCode(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().toLowerCase();
}

