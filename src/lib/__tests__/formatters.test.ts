import { describe, expect, it } from 'vitest';

import type { ActivityDto } from '@/types';
import {
  activityDtoToViewModel,
  formatDistance,
  formatDuration,
  formatElevation,
  formatPace,
  parseDurationToSeconds,
} from '@/lib/formatters';

describe('activity formatters', () => {
  it('converts meters to kilometers with one decimal place', () => {
    expect(formatDistance(10500)).toBe('10.5 km');
    expect(formatDistance(null)).toBe('0,0 km');
  });

  it('formats elevation to rounded meters', () => {
    expect(formatElevation(123.7)).toBe('124 m');
    expect(formatElevation(undefined)).toBe('0 m');
  });

  it('parses duration strings to seconds', () => {
    expect(parseDurationToSeconds('3600s')).toBe(3600);
    expect(parseDurationToSeconds('PT90S')).toBe(90);
    expect(parseDurationToSeconds('invalid')).toBe(0);
  });

  it('formats duration to hours and minutes', () => {
    expect(formatDuration('3600s')).toBe('1h 0m');
    expect(formatDuration('1800s')).toBe('30m');
    expect(formatDuration(null)).toBe('0m');
  });

  it('formats running pace per kilometer', () => {
    expect(formatPace(10000, '3600s')).toBe('6:00 /km');
    expect(formatPace(0, '3600s')).toBe('—');
  });

  it('maps ActivityDto to ActivityViewModel with fallbacks', () => {
    const dto = {
      id: '1',
      user_id: 'demo',
      name: null,
      type: null,
      sport_type: null,
      start_date: null,
      start_date_local: null,
      timezone: 'Europe/Warsaw',
      utc_offset: 0,
      distance: null,
      moving_time: null,
      elapsed_time: null,
      total_elevation_gain: null,
      average_speed: null,
    } as ActivityDto;

    const viewModel = activityDtoToViewModel(dto);
    expect(viewModel).toEqual(
      expect.objectContaining({
        id: '1',
        name: 'Aktywność bez nazwy',
        type: 'Nieznany typ',
        startDate: 'Brak daty',
        distance: '0,0 km',
        duration: '0m',
        elevation: '0 m',
        pace: '—',
      })
    );
  });
});

