import type { APIRoute } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ZodError } from 'zod';

import type { Database } from '../../db/database.types.js';
import {
  ActivitiesServiceError,
  ActivitiesServiceErrors,
  generateActivities,
} from '../../services/activities.js';
import { getSports, GetSportsError } from '../../services/sports/getSports.js';
import type { ErrorDto, GenerateActivitiesResponse } from '../../types.js';
import { generateActivitiesBodySchema, type GenerateActivitiesOverrides } from '../../validators/activity.js';
import { AuthError } from '../../middleware/requireAuth.js';
import { requireAuth } from '../../middleware/requireAuth.js';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { userId } = await requireAuth(request, { supabase: locals.supabase });
    const overrides = await parseGenerateActivitiesBody(request);
    
    // Fetch sports from database
    const allSports = await getSports();
    
    // Filter sports based on primary_sports if provided
    let selectedSports = allSports;
    if (overrides.primary_sports && overrides.primary_sports.length > 0) {
      const requestedCodes = overrides.primary_sports.map(code => code.trim().toLowerCase());
      selectedSports = allSports.filter(sport => requestedCodes.includes(sport.code.toLowerCase()));
      
      // If no matching sports found, throw validation error
      if (selectedSports.length === 0) {
        throw new ActivitiesServiceError(
          ActivitiesServiceErrors.VALIDATION_ERROR,
          'None of the requested sports exist in the database',
          { requested_sports: overrides.primary_sports }
        );
      }
    }
    
    // If no sports available, throw error
    if (selectedSports.length === 0) {
      throw new ActivitiesServiceError(
        ActivitiesServiceErrors.VALIDATION_ERROR,
        'No sports available in the database. Please add sports first.'
      );
    }
    
    const result = await generateActivities(userId, selectedSports, overrides);
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
        code: 'custom',
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

  if (error instanceof GetSportsError) {
    console.error('Failed to fetch sports:', error);
    return errorResponse(500, error.code, error.message, error.details);
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

