import { describe, expect, it } from 'vitest';

import { buildActivityTotals, countBySport, isGoalAchieved } from '../useDashboardData.js';
import type { ActivityDto, GoalDto, SportDto } from '../../types.js';

let idCounter = 0;
const createId = () => `test-id-${++idCounter}`;

const createActivity = (overrides: Partial<ActivityDto> = {}): ActivityDto => ({
  id: overrides.id ?? createId(),
  user_id: 'user-1',
  name: 'Activity',
  type: overrides.type ?? 'Run',
  sport_type: overrides.sport_type ?? 'run',
  start_date: overrides.start_date ?? '2025-01-01T00:00:00Z',
  start_date_local: overrides.start_date_local ?? '2025-01-01T00:00:00Z',
  timezone: overrides.timezone ?? 'UTC',
  utc_offset: overrides.utc_offset ?? 0,
  distance: overrides.distance ?? 0,
  moving_time: overrides.moving_time ?? '0',
  elapsed_time: overrides.elapsed_time ?? '0',
  total_elevation_gain: overrides.total_elevation_gain ?? 0,
  average_speed: overrides.average_speed ?? 0,
  created_at: overrides.created_at ?? null,
  updated_at: overrides.updated_at ?? null,
});

const createGoal = (overrides: Partial<GoalDto> = {}): GoalDto => ({
  id: overrides.id ?? createId(),
  user_id: overrides.user_id ?? 'user-1',
  metric_type: overrides.metric_type ?? 'distance',
  scope_type: overrides.scope_type ?? 'global',
  target_value: overrides.target_value ?? 0,
  sport_id: overrides.sport_id ?? null,
  created_at: overrides.created_at ?? null,
});

const createSport = (overrides: Partial<SportDto> = {}): SportDto => ({
  id: overrides.id ?? createId(),
  code: overrides.code ?? 'run',
  name: overrides.name ?? 'Bieganie',
  description: overrides.description ?? null,
  consolidated: overrides.consolidated ?? null,
});

describe('countBySport', () => {
  it('returns sorted breakdown with sport names when available', () => {
    const items = countBySport(
      [
        createActivity({ sport_type: 'bike' }),
        createActivity({ sport_type: 'run' }),
        createActivity({ sport_type: 'run' }),
      ],
      {
        run: 'Bieganie',
      }
    );

    expect(items).toEqual([
      { sport: 'Bieganie (run)', count: 2 },
      { sport: 'bike', count: 1 },
    ]);
  });
});

describe('isGoalAchieved', () => {
  const sportRun = createSport({ id: 'sport-run', code: 'run', name: 'Bieganie' });
  const sportBike = createSport({ id: 'sport-bike', code: 'bike', name: 'Rower' });

  const sportsLookup = {
    byId: new Map<string, SportDto>([
      [sportRun.id, sportRun],
      [sportBike.id, sportBike],
    ]),
    codeToName: {
      run: sportRun.name,
      bike: sportBike.name,
    },
  };

  it('checks global goals using aggregated totals', () => {
    const totals = buildActivityTotals([
      createActivity({ distance: 12000 }),
      createActivity({ distance: 8000 }),
    ]);

    const goal = createGoal({
      scope_type: 'global',
      metric_type: 'distance',
      target_value: 15000,
    });

    expect(isGoalAchieved(goal, totals, sportsLookup)).toBe(true);
  });

  it('checks per sport goals using sport code mapping', () => {
    const totals = buildActivityTotals([
      createActivity({ sport_type: 'run', distance: 10000, moving_time: '3600s' }),
      createActivity({ sport_type: 'bike', distance: 5000, moving_time: '1800s' }),
    ]);

    const timeGoal = createGoal({
      scope_type: 'per_sport',
      sport_id: sportRun.id,
      metric_type: 'time',
      target_value: 1, // hours
    });

    const bikeGoal = createGoal({
      scope_type: 'per_sport',
      sport_id: sportBike.id,
      metric_type: 'distance',
      target_value: 6000,
    });

    expect(isGoalAchieved(timeGoal, totals, sportsLookup)).toBe(true);
    expect(isGoalAchieved(bikeGoal, totals, sportsLookup)).toBe(false);
  });

  it('returns false when sport mapping is missing', () => {
    const totals = buildActivityTotals([createActivity({ sport_type: 'swim', distance: 4000 })]);

    const goal = createGoal({
      scope_type: 'per_sport',
      sport_id: 'missing-sport',
      metric_type: 'distance',
      target_value: 1000,
    });

    expect(isGoalAchieved(goal, totals, sportsLookup)).toBe(false);
  });
});

