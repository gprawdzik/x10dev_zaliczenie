import type { APIRoute } from 'astro';
import { ZodError } from 'zod';

import { AuthError } from '../../middleware/requireAuth.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import {
  ActivitiesServiceError,
  ActivitiesServiceErrors,
  generateActivities,
} from '../../services/activities.js';
import type { ErrorDto, GenerateActivitiesResponse } from '../../types.js';
import { generateActivitiesBodySchema, type GenerateActivitiesOverrides } from '../../validators/activity.js';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { userId } = await requireAuth(request);
    const overrides = await parseGenerateActivitiesBody(request);
    const result = await generateActivities(userId, overrides);
    return jsonResponse(result satisfies GenerateActivitiesResponse, 201);
  } catch (error) {
    return handleGenerateActivitiesError(error);
  }
};

async function parseGenerateActivitiesBody(request: Request): Promise<GenerateActivitiesOverrides> {
  const rawBody = await request.text();

  if (!rawBody.trim()) {
    return generateActivitiesBodySchema.parse({});
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    throw new ZodError([
      {
        code: 'invalid_type',
        expected: 'object',
        received: 'string',
        path: [],
        message: 'Request body must be valid JSON',
      },
    ]);
  }

  return generateActivitiesBodySchema.parse(parsedBody);
}

function handleGenerateActivitiesError(error: unknown): Response {
  if (error instanceof AuthError) {
    return errorResponse(401, error.code, error.message, error.details);
  }

  if (error instanceof ZodError) {
    const validationErrors = error.issues.map((issue) => ({
      field: issue.path.join('.') || undefined,
      message: issue.message,
    }));

    return errorResponse(422, 'UNPROCESSABLE_ENTITY', 'Invalid request payload', {
      validation_errors: validationErrors,
    });
  }

  if (error instanceof ActivitiesServiceError) {
    switch (error.code) {
      case ActivitiesServiceErrors.VALIDATION_ERROR:
        return errorResponse(422, error.code, error.message, error.details);
      case ActivitiesServiceErrors.CLIENT_UNAVAILABLE:
      case ActivitiesServiceErrors.DATABASE_ERROR:
        console.error('Activities generation failure:', error);
        return errorResponse(500, error.code, error.message, error.details);
      default:
        console.error('Unknown activities service error:', error);
        return errorResponse(500, 'INTERNAL_ERROR', 'Unexpected activities service error');
    }
  }

  console.error('Unhandled error in POST /api/activities-generate:', error);
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

