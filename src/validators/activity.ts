import { z } from 'zod';

const SORTABLE_FIELDS = ['start_date', 'distance', 'moving_time'] as const;
const SORT_DIRECTIONS = ['asc', 'desc'] as const;

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
    sort_by: z.enum(SORTABLE_FIELDS).default('start_date'),
    sort_dir: z.enum(SORT_DIRECTIONS).default('desc'),
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
});

export type ListActivitiesQuery = z.output<typeof listActivitiesQuerySchema>;
export type GenerateActivitiesOverrides = z.output<typeof generateActivitiesBodySchema>;
export type ActivitySortField = (typeof SORTABLE_FIELDS)[number];
export type ActivitySortDirection = (typeof SORT_DIRECTIONS)[number];

export const ACTIVITY_SORTABLE_FIELDS = SORTABLE_FIELDS;
export const ACTIVITY_SORT_DIRECTIONS = SORT_DIRECTIONS;

