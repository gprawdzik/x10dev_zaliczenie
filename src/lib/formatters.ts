import type { ActivityDto, ActivityViewModel } from '../types.js';

const DEFAULT_LOCALE = 'pl-PL';

export function formatActivityDate(isoDate: string | null | undefined, locale = DEFAULT_LOCALE): string {
  if (!isoDate) {
    return 'Brak daty';
  }

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return 'Brak daty';
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatDistance(distanceInMeters: number | null | undefined): string {
  if (typeof distanceInMeters !== 'number' || Number.isNaN(distanceInMeters)) {
    return '0,0 km';
  }

  const distanceInKm = distanceInMeters / 1000;
  return `${distanceInKm.toFixed(1)} km`;
}

export function formatElevation(value: number | null | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0 m';
  }

  return `${Math.round(value)} m`;
}

export function formatDuration(duration: string | unknown | null | undefined): string {
  const totalSeconds = parseDurationToSeconds(duration);
  if (totalSeconds <= 0) {
    return '0m';
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours <= 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

export function formatPace(distanceInMeters: number | null | undefined, duration: string | unknown | null | undefined): string {
  const totalSeconds = parseDurationToSeconds(duration);
  if (!distanceInMeters || distanceInMeters <= 0 || totalSeconds <= 0) {
    return '—';
  }

  const paceSeconds = totalSeconds / (distanceInMeters / 1000);
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = Math.round(paceSeconds % 60);
  const paddedSeconds = seconds.toString().padStart(2, '0');
  return `${minutes}:${paddedSeconds} /km`;
}

export function parseDurationToSeconds(duration: string | unknown | null | undefined): number {
  if (!duration || typeof duration !== 'string') {
    return 0;
  }

  // Supabase stores intervals in ISO 8601 duration format or as "<number>s" (e.g., "3600s").
  const numeric = duration.replace(/[^\d]/g, '');
  if (!numeric) {
    return 0;
  }

  const value = Number.parseInt(numeric, 10);
  return Number.isNaN(value) ? 0 : value;
}

export function activityDtoToViewModel(dto: ActivityDto): ActivityViewModel {
  return {
    id: dto.id,
    name: dto.name ?? 'Aktywność bez nazwy',
    type: dto.sport_type ?? dto.type ?? 'Nieznany typ',
    startDate: formatActivityDate(dto.start_date),
    distance: formatDistance(dto.distance),
    duration: formatDuration(dto.moving_time),
    elevation: formatElevation(dto.total_elevation_gain),
    pace: formatPace(dto.distance, dto.moving_time),
  };
}

