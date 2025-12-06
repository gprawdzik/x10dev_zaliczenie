import { describe, expect, it } from 'vitest';

import { buildCumulativeSeries } from '../progress';

const baseActivity = {
  distance: 0,
  moving_time: '0 seconds',
  total_elevation_gain: 0,
  sport_type: 'RUN',
} as const;

describe('buildCumulativeSeries', () => {
  it('fills day-by-day for current year and stops at today', () => {
    const activities = [
      { ...baseActivity, start_date: '2025-01-01T10:00:00Z', distance: 1000 },
      { ...baseActivity, start_date: '2025-01-01T18:00:00Z', distance: 500 },
      { ...baseActivity, start_date: '2025-01-02T09:00:00Z', distance: 200 },
    ];

    const series = buildCumulativeSeries(activities, 'distance', 2025, new Date('2025-01-03T00:00:00Z'));

    expect(series).toEqual([
      { date: '2025-01-01', value: 1500 },
      { date: '2025-01-02', value: 1700 },
      { date: '2025-01-03', value: 1700 },
    ]);
  });

  it('fills full leap year when past year and parses interval strings', () => {
    const activities = [
      { ...baseActivity, start_date: '2024-02-01T10:00:00Z', moving_time: '00:10:00' },
      { ...baseActivity, start_date: '2024-02-02T10:00:00Z', moving_time: 'PT300S' },
      { ...baseActivity, start_date: '2024-02-02T12:00:00Z', moving_time: '600 seconds' },
    ];

    const series = buildCumulativeSeries(activities, 'time', 2024, new Date('2025-01-10T00:00:00Z'));

    expect(series.length).toBe(366); // leap year
    expect(series[0]).toEqual({ date: '2024-01-01', value: 0 });
    const feb1 = series.find((p) => p.date === '2024-02-01');
    const feb2 = series.find((p) => p.date === '2024-02-02');
    const last = series[series.length - 1];
    expect(feb1).toEqual({ date: '2024-02-01', value: 600 });
    expect(feb2).toEqual({ date: '2024-02-02', value: 1500 });
    expect(last).toEqual({ date: '2024-12-31', value: 1500 });
  });

  it('ignores records with invalid dates and fills missing days', () => {
    const activities = [
      { ...baseActivity, start_date: 'invalid-date', distance: 100 },
      { ...baseActivity, start_date: '2025-03-01T00:00:00Z', distance: 50 },
    ];

    const series = buildCumulativeSeries(activities, 'distance', 2025, new Date('2025-03-02T00:00:00Z'));

    expect(series).toEqual([
      { date: '2025-01-01', value: 0 },
      { date: '2025-01-02', value: 0 },
      { date: '2025-01-03', value: 0 },
      { date: '2025-01-04', value: 0 },
      { date: '2025-01-05', value: 0 },
      { date: '2025-01-06', value: 0 },
      { date: '2025-01-07', value: 0 },
      { date: '2025-01-08', value: 0 },
      { date: '2025-01-09', value: 0 },
      { date: '2025-01-10', value: 0 },
      { date: '2025-01-11', value: 0 },
      { date: '2025-01-12', value: 0 },
      { date: '2025-01-13', value: 0 },
      { date: '2025-01-14', value: 0 },
      { date: '2025-01-15', value: 0 },
      { date: '2025-01-16', value: 0 },
      { date: '2025-01-17', value: 0 },
      { date: '2025-01-18', value: 0 },
      { date: '2025-01-19', value: 0 },
      { date: '2025-01-20', value: 0 },
      { date: '2025-01-21', value: 0 },
      { date: '2025-01-22', value: 0 },
      { date: '2025-01-23', value: 0 },
      { date: '2025-01-24', value: 0 },
      { date: '2025-01-25', value: 0 },
      { date: '2025-01-26', value: 0 },
      { date: '2025-01-27', value: 0 },
      { date: '2025-01-28', value: 0 },
      { date: '2025-01-29', value: 0 },
      { date: '2025-01-30', value: 0 },
      { date: '2025-01-31', value: 0 },
      { date: '2025-02-01', value: 0 },
      { date: '2025-02-02', value: 0 },
      { date: '2025-02-03', value: 0 },
      { date: '2025-02-04', value: 0 },
      { date: '2025-02-05', value: 0 },
      { date: '2025-02-06', value: 0 },
      { date: '2025-02-07', value: 0 },
      { date: '2025-02-08', value: 0 },
      { date: '2025-02-09', value: 0 },
      { date: '2025-02-10', value: 0 },
      { date: '2025-02-11', value: 0 },
      { date: '2025-02-12', value: 0 },
      { date: '2025-02-13', value: 0 },
      { date: '2025-02-14', value: 0 },
      { date: '2025-02-15', value: 0 },
      { date: '2025-02-16', value: 0 },
      { date: '2025-02-17', value: 0 },
      { date: '2025-02-18', value: 0 },
      { date: '2025-02-19', value: 0 },
      { date: '2025-02-20', value: 0 },
      { date: '2025-02-21', value: 0 },
      { date: '2025-02-22', value: 0 },
      { date: '2025-02-23', value: 0 },
      { date: '2025-02-24', value: 0 },
      { date: '2025-02-25', value: 0 },
      { date: '2025-02-26', value: 0 },
      { date: '2025-02-27', value: 0 },
      { date: '2025-02-28', value: 0 },
      { date: '2025-03-01', value: 50 },
      { date: '2025-03-02', value: 50 },
    ]);
  });

  it('returns zeroed series up to today when there are no activities in current year', () => {
    const today = new Date('2025-02-10T12:00:00Z');
    const series = buildCumulativeSeries([], 'distance', 2025, today);

    expect(series.length).toBe(41); // Jan 1 through Feb 10 inclusive
    expect(series[0]).toEqual({ date: '2025-01-01', value: 0 });
    expect(series.at(-1)).toEqual({ date: '2025-02-10', value: 0 });
  });

  it('fills full past year with zeros when no activities exist', () => {
    const series = buildCumulativeSeries([], 'distance', 2024, new Date('2025-01-05T00:00:00Z'));

    expect(series.length).toBe(366); // leap year
    expect(series[0]).toEqual({ date: '2024-01-01', value: 0 });
    expect(series.at(-1)).toEqual({ date: '2024-12-31', value: 0 });
  });
});

