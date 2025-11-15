import type { APIRoute } from 'astro';
import { ZodError } from 'zod';

import { AuthError } from '../../middleware/requireAuth.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import {
  ActivitiesServiceError,
  ActivitiesServiceErrors,
  listActivities,
} from '../../services/activities.js';
import type { ErrorDto } from '../../types.js';
import { listActivitiesQuerySchema, type ListActivitiesQuery } from '../../validators/activity.js';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const { userId } = await requireAuth(request);
    const params = parseListActivitiesQuery(request.url);
    const paginatedActivities = await listActivities(userId, params);
    return jsonResponse(paginatedActivities, 200);
  } catch (error) {
    return handleListActivitiesError(error);
  }
};

function parseListActivitiesQuery(url: string): ListActivitiesQuery {
  const searchParams = new URL(url).searchParams;
  const rawParams: Record<string, unknown> = {
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
    sport_type: searchParams.get('sport_type') ?? undefined,
    type: searchParams.get('type') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
    sort_by: searchParams.get('sort_by') ?? undefined,
    sort_dir: searchParams.get('sort_dir') ?? undefined,
  };

  return listActivitiesQuerySchema.parse(rawParams);
}

function handleListActivitiesError(error: unknown): Response {
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

  if (error instanceof ActivitiesServiceError) {
    switch (error.code) {
      case ActivitiesServiceErrors.VALIDATION_ERROR:
        return errorResponse(400, error.code, error.message, error.details);
      case ActivitiesServiceErrors.CLIENT_UNAVAILABLE:
      case ActivitiesServiceErrors.DATABASE_ERROR:
        console.error('Activities service failure:', error);
        return errorResponse(500, error.code, error.message, error.details);
      default:
        console.error('Unknown activities service error:', error);
        return errorResponse(500, 'INTERNAL_ERROR', 'Unexpected activities service error');
    }
  }

  console.error('Unhandled error in GET /api/activities:', error);
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

