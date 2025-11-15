import type { SupabaseClient, User } from '@supabase/supabase-js';

import type { Database } from '../db/database.types.js';
import { supabaseClient } from '../db/supabase.client.js';

export const AuthErrorCodes = {
  CLIENT_UNAVAILABLE: 'AUTH_CLIENT_UNAVAILABLE',
  MISSING_TOKEN: 'AUTH_MISSING_TOKEN',
  INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
} as const;

export class AuthError extends Error {
  constructor(
    public code: (typeof AuthErrorCodes)[keyof typeof AuthErrorCodes] | string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

const BEARER_PREFIX = 'bearer ';

export type RequireAuthOptions = {
  supabase?: SupabaseClient<Database>;
};

export type RequireAuthResult = {
  userId: string;
  user: User;
  accessToken: string;
};

export async function requireAuth(request: Request, options?: RequireAuthOptions): Promise<RequireAuthResult> {
  const client = options?.supabase ?? supabaseClient;
  if (!client) {
    throw new AuthError(AuthErrorCodes.CLIENT_UNAVAILABLE, 'Supabase client is not initialized');
  }

  const token = extractToken(request);
  if (!token) {
    throw new AuthError(AuthErrorCodes.MISSING_TOKEN, 'Access token is required for this operation');
  }

  const { data, error } = await client.auth.getUser(token);

  if (error || !data?.user) {
    throw new AuthError(AuthErrorCodes.INVALID_TOKEN, 'Invalid or expired access token', {
      originalError: error?.message,
    });
  }

  return {
    userId: data.user.id,
    user: data.user,
    accessToken: token,
  };
}

function extractToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const trimmedValue = authHeader.trim();
    if (trimmedValue.toLowerCase().startsWith(BEARER_PREFIX)) {
      return trimmedValue.slice(BEARER_PREFIX.length).trim();
    }
  }

  const fallbackHeader = request.headers.get('x-supabase-access-token');
  if (fallbackHeader) {
    return fallbackHeader.trim();
  }

  return extractTokenFromCookies(request.headers.get('cookie'));
}

function extractTokenFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .filter(Boolean);

  for (const cookie of cookies) {
    const [name, rawValue] = cookie.split('=');
    if (!rawValue) {
      continue;
    }

    if (
      name === 'sb-access-token' ||
      name === 'sb-auth-token' ||
      (name.startsWith('sb-') && (name.endsWith('-access-token') || name.endsWith('-auth-token')))
    ) {
      return decodeURIComponent(rawValue);
    }
  }

  return null;
}

