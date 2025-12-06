import { z } from 'zod';

const METRIC_TYPES = ['distance', 'time', 'elevation_gain'] as const;

const uuidSchema = z
  .string()
  .trim()
  .uuid('sport_id must be a valid UUID');

export const progressAnnualSchema = z
  .object({
    year: z
      .coerce.number()
      .int('year must be an integer')
      .min(2000, 'year must be greater than or equal to 2000'),
    metric_type: z.enum(METRIC_TYPES),
    sport_id: uuidSchema.nullable().optional(),
  })
  .transform((value) => ({
    ...value,
    sport_id: value.sport_id ?? null,
  }));

export type ProgressAnnualInput = z.output<typeof progressAnnualSchema>;

export const PROGRESS_METRIC_TYPES = METRIC_TYPES;

