import { z } from 'zod';

import {
  ACTIVITY_SORTABLE_FIELDS,
  ACTIVITY_SORT_DIRECTIONS,
} from '../types.js';

const isoDateSchema = z
  .string()
  .datetime({ offset: true, message: 'Value must be a valid ISO 8601 date with timezone' });

function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/**
 * Zod schema for validating /api/activities query parameters.
 */
export const listActivitiesQuerySchema = z
  .object({
    from: isoDateSchema.optional(),
    to: isoDateSchema.optional(),
    sport_type: z
      .string()
      .trim()
      .min(1, 'sport_type must contain at least 1 character')
      .max(64, 'sport_type must not exceed 64 characters')
      .optional(),
    type: z
      .string()
      .trim()
      .min(1, 'type must contain at least 1 character')
      .max(64, 'type must not exceed 64 characters')
      .optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort_by: z.enum(ACTIVITY_SORTABLE_FIELDS).default('start_date'),
    sort_dir: z.enum(ACTIVITY_SORT_DIRECTIONS).default('desc'),
  })
  .refine(
    (data) => {
      if (data.from && data.to) {
        return new Date(data.from).getTime() <= new Date(data.to).getTime();
      }
      return true;
    },
    { message: '"from" must be earlier than "to"', path: ['to'] }
  );

const distributionSchema = z
  .object({
    primary: z.number().min(0).max(1),
    secondary: z.number().min(0).max(1),
    tertiary: z.number().min(0).max(1),
    quaternary: z.number().min(0).max(1),
  })
  .refine(
    (dist) => {
      const sum = dist.primary + dist.secondary + dist.tertiary + dist.quaternary;
      return Math.abs(sum - 1) <= 0.01;
    },
    {
      message: 'Distribution values must add up to 1.0 (±0.01)',
      path: ['quaternary'],
    }
  );

/**
 * Zod schema for validating /api/activities-generate body payload.
 */
export const generateActivitiesBodySchema = z.object({
  primary_sports: z
    .array(
      z
        .string()
        .trim()
        .min(1, 'Each sport_type must contain at least 1 character')
        .max(64, 'Each sport_type must not exceed 64 characters')
    )
    .min(1, 'Provide at least one primary sport')
    .max(25, 'Provide at most 25 primary sports')
    .optional(),
  distribution: distributionSchema.optional(),
  timezone: z
    .string()
    .trim()
    .min(1, 'timezone is required')
    .max(64, 'timezone must not exceed 64 characters')
    .refine(isValidTimeZone, 'timezone must be a valid IANA identifier')
    .optional(),
  year: z
    .number({ invalid_type_error: 'year must be a number' })
    .int('year must be an integer')
    .optional(),
});

export type ListActivitiesQuery = z.output<typeof listActivitiesQuerySchema>;
export type GenerateActivitiesOverrides = z.output<typeof generateActivitiesBodySchema>;
export type { ActivitySortField, ActivitySortDirection } from '../types.js';
export { ACTIVITY_SORTABLE_FIELDS, ACTIVITY_SORT_DIRECTIONS } from '../types.js';

