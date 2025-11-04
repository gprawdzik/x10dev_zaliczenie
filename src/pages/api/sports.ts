import type { APIRoute } from 'astro';
import { ZodError } from 'zod';
import { createSportSchema, type CreateSportCommand } from '../../validators/createSport.js';
import { createSport, SportCreationError, SportCreationErrors } from '../../services/sports/createSport.js';
import type { ErrorDto, SportDto } from '../../types.js';

// Mark this endpoint as server-rendered to enable request body access
export const prerender = false;

/**
 * Helper function to parse and validate JSON body from request
 */
async function parseBody<T>(request: Request, schema: { parse: (data: unknown) => T }): Promise<T> {
  // Parse JSON from request body
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    throw new Error('Invalid JSON format or empty request body');
  }

  // Validate with Zod schema
  return schema.parse(json) as T;
}

/**
 * Helper function to create error response
 */
function errorResponse(status: number, code: string, message: string, details?: Record<string, unknown>): Response {
  const body: ErrorDto = {
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * POST /api/sports
 *
 * Creates a new sport in the database.
 *
 * Request body:
 * {
 *   "code": "run",
 *   "name": "Running",
 *   "description": "optional"
 * }
 *
 * Responses:
 * - 201: Sport created successfully
 * - 400: Invalid input data
 * - 409: Sport with this code already exists
 * - 500: Internal server error
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Step 1: Parse and validate request body
    let command: CreateSportCommand;
    try {
      command = await parseBody<CreateSportCommand>(request, createSportSchema);
    } catch (error) {
      // Handle validation errors
      if (error instanceof ZodError) {
        const validationErrors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return errorResponse(400, 'invalid_input', 'Validation failed', {
          validation_errors: validationErrors,
        });
      }

      // Handle JSON parsing errors
      return errorResponse(400, 'invalid_input', error instanceof Error ? error.message : 'Invalid request body');
    }

    // Step 2: Execute business logic - create sport
    let sport: SportDto;
    try {
      sport = await createSport(command);
    } catch (error) {
      // Handle business logic errors
      if (error instanceof SportCreationError) {
        switch (error.code) {
          case SportCreationErrors.DUPLICATE_CODE:
            return errorResponse(409, error.code, error.message, error.details);

          case SportCreationErrors.UNAUTHORIZED:
            return errorResponse(403, error.code, error.message, error.details);

          case SportCreationErrors.DATABASE_ERROR:
            console.error('Database error creating sport:', error);
            return errorResponse(500, error.code, error.message);

          default:
            console.error('Unknown sport creation error:', error);
            return errorResponse(500, 'internal_error', 'An unexpected error occurred');
        }
      }

      // Handle unexpected errors
      console.error('Unexpected error creating sport:', error);
      return errorResponse(500, 'internal_error', 'An unexpected error occurred');
    }

    // Step 3: Return success response
    return new Response(JSON.stringify(sport), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    // Catch-all error handler
    console.error('Unhandled error in POST /api/sports:', error);
    return errorResponse(500, 'internal_error', 'An unexpected error occurred');
  }
};

