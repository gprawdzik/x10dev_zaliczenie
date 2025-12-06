import type { APIRoute } from 'astro';
import { ZodError, type ZodSchema } from 'zod';

import { AuthError } from '../../middleware/requireAuth.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import {
  GoalsServiceError,
  GoalsServiceErrors,
  createGoal,
  deleteGoal,
  getGoal,
  listGoals,
  updateGoal,
} from '../../services/goals/index.js';
import type { ErrorDto } from '../../types.js';
import {
  createGoalSchema,
  goalsQuerySchema,
  updateGoalSchema,
  type CreateGoalInput,
  type GoalsQuery,
  type UpdateGoalInput,
} from '../../validators/goals.js';

export const prerender = false;

class UnsupportedMediaTypeError extends Error {
  public readonly code = 'UNSUPPORTED_MEDIA_TYPE';

  constructor(message = 'Requests must specify application/json as the Content-Type header') {
    super(message);
    this.name = 'UnsupportedMediaTypeError';
  }
}

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const { userId } = await requireAuth(request, { supabase: locals.supabase });
    const searchParams = new URL(request.url).searchParams;
    const goalId = extractResourceId(searchParams.get('id'));

    if (goalId) {
      const goal = await getGoal(userId, goalId, { supabase: locals.supabase });
      return jsonResponse(goal);
    }

    const query = parseGoalsQuery(searchParams);
    const paginatedGoals = await listGoals(userId, query, { supabase: locals.supabase });
    return jsonResponse(paginatedGoals);
  } catch (error) {
    return handleGoalsError(error, 'GET /api/goals');
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { userId } = await requireAuth(request, { supabase: locals.supabase });
    ensureJsonRequest(request);
    const payload = await parseJsonBody<CreateGoalInput>(request, createGoalSchema);
    const goal = await createGoal(userId, payload, { supabase: locals.supabase });
    return jsonResponse(goal, 201);
  } catch (error) {
    return handleGoalsError(error, 'POST /api/goals');
  }
};

export const PATCH: APIRoute = async ({ request, locals }) => {
  try {
    const { userId } = await requireAuth(request, { supabase: locals.supabase });
    ensureJsonRequest(request);

    const searchParams = new URL(request.url).searchParams;
    const goalId = extractResourceId(searchParams.get('id'));
    if (!goalId) {
      throw new GoalsServiceError(
        GoalsServiceErrors.VALIDATION_ERROR,
        'Goal identifier is required via the "id" query parameter'
      );
    }

    const updates = await parseJsonBody<UpdateGoalInput>(request, updateGoalSchema);
    const updatedGoal = await updateGoal(userId, goalId, updates, { supabase: locals.supabase });
    return jsonResponse(updatedGoal);
  } catch (error) {
    return handleGoalsError(error, 'PATCH /api/goals');
  }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const { userId } = await requireAuth(request, { supabase: locals.supabase });
    const searchParams = new URL(request.url).searchParams;
    const goalId = extractResourceId(searchParams.get('id'));

    if (!goalId) {
      throw new GoalsServiceError(
        GoalsServiceErrors.VALIDATION_ERROR,
        'Goal identifier is required via the "id" query parameter'
      );
    }

    await deleteGoal(userId, goalId, { supabase: locals.supabase });
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleGoalsError(error, 'DELETE /api/goals');
  }
};

function parseGoalsQuery(searchParams: URLSearchParams): GoalsQuery {
  const rawFilters: Record<string, unknown> = {
    sport_id: searchParams.get('sport_id') ?? undefined,
    scope_type: searchParams.get('scope_type') ?? undefined,
    metric_type: searchParams.get('metric_type') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
    sort_by: searchParams.get('sort_by') ?? undefined,
    sort_dir: searchParams.get('sort_dir') ?? undefined,
  };

  return goalsQuerySchema.parse(rawFilters);
}

function extractResourceId(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.startsWith('eq.') ? value.slice(3) : value;
  return normalized.trim() || null;
}

function ensureJsonRequest(request: Request): void {
  const contentType = request.headers.get('content-type');
  if (!contentType || !contentType.toLowerCase().includes('application/json')) {
    throw new UnsupportedMediaTypeError();
  }
}

async function parseJsonBody<T>(request: Request, schema: ZodSchema<T>): Promise<T> {
  const rawBody = await request.text();

  if (!rawBody.trim()) {
    throw new ZodError([
      {
        code: 'custom',
        path: [],
        message: 'Request body must not be empty',
      },
    ]);
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    throw new ZodError([
      {
        code: 'custom',
        path: [],
        message: 'Request body contains invalid JSON',
      },
    ]);
  }

  return schema.parse(parsedBody);
}

function handleGoalsError(error: unknown, context: string): Response {
  if (error instanceof UnsupportedMediaTypeError) {
    return errorResponse(415, error.code, error.message);
  }

  if (error instanceof AuthError) {
    return errorResponse(401, error.code, error.message, error.details);
  }

  if (error instanceof ZodError) {
    const validationErrors = error.issues.map((issue) => ({
      field: issue.path.join('.') || undefined,
      message: issue.message,
    }));

    return errorResponse(400, 'VALIDATION_ERROR', 'Invalid payload or query parameters', {
      validation_errors: validationErrors,
    });
  }

  if (error instanceof GoalsServiceError) {
    switch (error.code) {
      case GoalsServiceErrors.VALIDATION_ERROR:
        return errorResponse(400, error.code, error.message, error.details);
      case GoalsServiceErrors.NOT_FOUND:
        return errorResponse(404, error.code, error.message, error.details);
      case GoalsServiceErrors.FORBIDDEN:
        return errorResponse(403, error.code, error.message, error.details);
      case GoalsServiceErrors.CONFLICT:
        return errorResponse(409, error.code, error.message, error.details);
      case GoalsServiceErrors.CLIENT_UNAVAILABLE:
      case GoalsServiceErrors.DATABASE_ERROR:
        console.error(`${context} failed due to service error:`, error);
        return errorResponse(500, error.code, error.message, error.details);
      default:
        console.error(`${context} failed due to unknown service error:`, error);
        return errorResponse(500, 'INTERNAL_ERROR', 'Unexpected goals service error');
    }
  }

  console.error(`Unhandled error in ${context}:`, error);
  return errorResponse(500, 'INTERNAL_ERROR', 'An unexpected error occurred');
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>
): Response {
  const body: ErrorDto = {
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };

  return jsonResponse(body, status);
}

