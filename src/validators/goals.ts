import { z } from 'zod';

const GOAL_SCOPE_TYPES = ['global', 'per_sport'] as const;
const GOAL_METRIC_TYPES = ['distance', 'time', 'elevation_gain'] as const;
const GOAL_SORTABLE_FIELDS = ['created_at', 'year', 'target_value'] as const;
const GOAL_HISTORY_SORTABLE_FIELDS = ['changed_at'] as const;
const SORT_DIRECTIONS = ['asc', 'desc'] as const;

const uuidSchema = z
  .string()
  .trim()
  .uuid('Value must be a valid UUID');

const yearSchema = z
  .coerce.number()
  .int('Year must be an integer')
  .min(2000, 'Year must be no earlier than 2000')
  .max(2100, 'Year must be no later than 2100');

const positiveNumberSchema = z
  .coerce.number()
  .positive('Value must be greater than zero');

export const createGoalSchema = z
  .object({
    scope_type: z.enum(GOAL_SCOPE_TYPES, { description: 'Goal scope type' }),
    year: yearSchema,
    metric_type: z.enum(GOAL_METRIC_TYPES, { description: 'Tracked metric type' }),
    target_value: positiveNumberSchema,
    sport_id: uuidSchema.nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.scope_type === 'per_sport' && !data.sport_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'sport_id is required when scope_type is "per_sport"',
        path: ['sport_id'],
      });
    }

    if (data.scope_type === 'global' && data.sport_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'sport_id must be null when scope_type is "global"',
        path: ['sport_id'],
      });
    }
  });

export const updateGoalSchema = z
  .object({
    metric_type: z.enum(GOAL_METRIC_TYPES, { description: 'Tracked metric type' }).optional(),
    target_value: positiveNumberSchema.optional(),
  })
  .refine((value) => Boolean(value.metric_type || value.target_value), {
    message: 'Provide at least one field to update (metric_type or target_value)',
  });

export const goalsQuerySchema = z.object({
  year: yearSchema.optional(),
  sport_id: uuidSchema.optional(),
  scope_type: z.enum(GOAL_SCOPE_TYPES).optional(),
  metric_type: z.enum(GOAL_METRIC_TYPES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort_by: z.enum(GOAL_SORTABLE_FIELDS).default('created_at'),
  sort_dir: z.enum(SORT_DIRECTIONS).default('desc'),
});

export const goalHistoryQuerySchema = z.object({
  goal_id: uuidSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort_by: z.enum(GOAL_HISTORY_SORTABLE_FIELDS).default('changed_at'),
  sort_dir: z.enum(SORT_DIRECTIONS).default('desc'),
});

export type CreateGoalInput = z.output<typeof createGoalSchema>;
export type UpdateGoalInput = z.output<typeof updateGoalSchema>;
export type GoalsQuery = z.output<typeof goalsQuerySchema>;
export type GoalHistoryQuery = z.output<typeof goalHistoryQuerySchema>;

export const GOALS_SORTABLE_FIELDS = GOAL_SORTABLE_FIELDS;
export const GOAL_HISTORY_SORT_FIELDS = GOAL_HISTORY_SORTABLE_FIELDS;
export const GOAL_SORT_DIRECTIONS = SORT_DIRECTIONS;
export const GOAL_SCOPE = GOAL_SCOPE_TYPES;
export const GOAL_METRIC = GOAL_METRIC_TYPES;

