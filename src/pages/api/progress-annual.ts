import type { APIRoute } from 'astro';
import { ZodError, type ZodTypeAny, type infer as zInfer } from 'zod';

import { AuthError } from '../../middleware/requireAuth.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import {
  ProgressServiceError,
  ProgressServiceErrors,
  getAnnualProgress,
} from '../../services/progress.js';
import type { ErrorDto } from '../../types.js';
import { progressAnnualSchema } from '../../validators/progress.js';

export const prerender = false;

class UnsupportedMediaTypeError extends Error {
  public readonly code = 'UNSUPPORTED_MEDIA_TYPE';

  constructor(message = 'Requests must specify application/json as the Content-Type header') {
    super(message);
    this.name = 'UnsupportedMediaTypeError';
  }
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { userId } = await requireAuth(request, { supabase: locals.supabase });
    ensureJsonRequest(request);

    const payload = await parseJsonBody(request, progressAnnualSchema);
    const progress = await getAnnualProgress(userId, payload, { supabase: locals.supabase });

    return jsonResponse(progress);
  } catch (error) {
    return handleProgressError(error, 'POST /api/progress-annual');
  }
};

function ensureJsonRequest(request: Request): void {
  const contentType = request.headers.get('content-type');
  if (!contentType || !contentType.toLowerCase().includes('application/json')) {
    throw new UnsupportedMediaTypeError();
  }
}

async function parseJsonBody<S extends ZodTypeAny>(request: Request, schema: S): Promise<zInfer<S>> {
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

function handleProgressError(error: unknown, context: string): Response {
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

    return errorResponse(400, 'VALIDATION_ERROR', 'Invalid payload', {
      validation_errors: validationErrors,
    });
  }

  if (error instanceof ProgressServiceError) {
    switch (error.code) {
      case ProgressServiceErrors.VALIDATION_ERROR:
        return errorResponse(400, error.code, error.message, error.details);
      case ProgressServiceErrors.NOT_FOUND:
        return errorResponse(404, error.code, error.message, error.details);
      case ProgressServiceErrors.CLIENT_UNAVAILABLE:
      case ProgressServiceErrors.DATABASE_ERROR:
        console.error(`${context} failed due to service error:`, error);
        return errorResponse(500, error.code, error.message, error.details);
      default:
        console.error(`${context} failed due to unknown service error:`, error);
        return errorResponse(500, 'INTERNAL_ERROR', 'Unexpected progress service error');
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

