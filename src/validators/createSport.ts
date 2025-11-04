import { z } from 'zod';

/**
 * Validation schema for creating a new sport.
 *
 * Business rules:
 * - code: snake_case format, min 1 char, max 32 chars, required
 * - name: min 1 char, max 64 chars, required
 * - description: optional, max 255 chars
 */
export const createSportSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .max(32, 'Code must not exceed 32 characters')
    .regex(
      /^[a-z][a-z0-9_]*$/,
      'Code must be in snake_case format (lowercase letters, digits, underscores)'
    ),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(64, 'Name must not exceed 64 characters'),
  description: z
    .string()
    .max(255, 'Description must not exceed 255 characters')
    .optional()
    .nullable(),
});

/**
 * Internal command type for creating a sport.
 * This represents the validated and sanitized data ready for business logic processing.
 */
export type CreateSportCommand = z.infer<typeof createSportSchema>;

