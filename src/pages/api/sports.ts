import type { APIRoute } from 'astro';
import { ZodError } from 'zod';
import { createSportSchema, type CreateSportCommand } from '../../validators/createSport.js';
import { createSport, SportCreationError, SportCreationErrors } from '../../services/sports/createSport.js';
import { getSports, GetSportsError } from '../../services/sports/getSports.js';
import { requireAuth, AuthError } from '../../middleware/requireAuth.js';
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
 * Requires authentication - only authenticated users can create sports.
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
 * - 401: Unauthorized (not authenticated)
 * - 409: Sport with this code already exists
 * - 500: Internal server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Verify authentication
    try {
      await requireAuth(request, { supabase: locals.supabase });
    } catch (error) {
      if (error instanceof AuthError) {
        return errorResponse(401, error.code, error.message, error.details);
      }
      throw error;
    }

    // Step 2: Parse and validate request body
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

    // Step 3: Execute business logic - create sport using authenticated client
    let sport: SportDto;
    try {
      sport = await createSport(locals.supabase, command);
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

    // Step 4: Return success response
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

/**
 * GET /api/sports
 *
 * Retrieves all sports from the database.
 *
 * Responses:
 * - 200: Array of sports
 * - 500: Internal server error
 */
export const GET: APIRoute = async () => {
  try {
    // Fetch all sports
    const sports = await getSports();

    // Return success response
    return new Response(JSON.stringify(sports), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    // Handle service errors
    if (error instanceof GetSportsError) {
      console.error('Error fetching sports:', error);
      return errorResponse(500, error.code, error.message);
    }

    // Catch-all error handler
    console.error('Unhandled error in GET /api/sports:', error);
    return errorResponse(500, 'internal_error', 'An unexpected error occurred');
  }
};

