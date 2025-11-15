import type { APIRoute } from 'astro';
import { ZodError } from 'zod';

import { AuthError } from '../../middleware/requireAuth.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import {
  GoalsServiceError,
  GoalsServiceErrors,
  listGoalHistory,
} from '../../services/goals/index.js';
import type { ErrorDto } from '../../types.js';
import { goalHistoryQuerySchema, type GoalHistoryQuery } from '../../validators/goals.js';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const { userId } = await requireAuth(request);
    const params = parseGoalHistoryQuery(request.url);
    const history = await listGoalHistory(userId, params);
    return jsonResponse(history);
  } catch (error) {
    return handleGoalHistoryError(error);
  }
};

function parseGoalHistoryQuery(url: string): GoalHistoryQuery {
  const searchParams = new URL(url).searchParams;
  const rawParams: Record<string, unknown> = {
    goal_id: extractResourceId(searchParams.get('goal_id')) ?? undefined,
    page: searchParams.get('page') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
    sort_by: searchParams.get('sort_by') ?? undefined,
    sort_dir: searchParams.get('sort_dir') ?? undefined,
  };

  return goalHistoryQuerySchema.parse(rawParams);
}

function extractResourceId(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.startsWith('eq.') ? value.slice(3) : value;
  return normalized.trim() || null;
}

function handleGoalHistoryError(error: unknown): Response {
  if (error instanceof AuthError) {
    return errorResponse(401, error.code, error.message, error.details);
  }

  if (error instanceof ZodError) {
    const validationErrors = error.issues.map((issue) => ({
      field: issue.path.join('.') || undefined,
      message: issue.message,
    }));

    return errorResponse(400, 'VALIDATION_ERROR', 'Invalid query parameters', {
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
      case GoalsServiceErrors.CLIENT_UNAVAILABLE:
      case GoalsServiceErrors.DATABASE_ERROR:
        console.error('GET /api/goal_history failed due to service error:', error);
        return errorResponse(500, error.code, error.message, error.details);
      default:
        console.error('GET /api/goal_history failed due to unknown service error:', error);
        return errorResponse(500, 'INTERNAL_ERROR', 'Unexpected goals service error');
    }
  }

  console.error('Unhandled error in GET /api/goal_history:', error);
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

