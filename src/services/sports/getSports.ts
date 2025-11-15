import { supabaseClient } from '../../db/supabase.client.js';
import type { SportDto } from '../../types.js';

/**
 * Error codes specific to fetching sports
 */
export const GetSportsErrors = {
  DATABASE_ERROR: 'database_error',
} as const;

/**
 * Custom error class for sport fetching failures
 */
export class GetSportsError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'GetSportsError';
  }
}

/**
 * Retrieves all sports from the database.
 * 
 * @returns Promise resolving to array of sport DTOs
 * @throws GetSportsError if the operation fails
 */
export async function getSports(): Promise<SportDto[]> {
  const client = supabaseClient;

  if (!client) {
    throw new GetSportsError(
      GetSportsErrors.DATABASE_ERROR,
      'Supabase client is not initialized'
    );
  }

  // Fetch all sports, ordered by name
  const { data, error } = await client
    .from('sports')
    .select('*')
    .order('name', { ascending: true });

  // Handle errors
  if (error) {
    console.error('Failed to fetch sports:', error);
    throw new GetSportsError(
      GetSportsErrors.DATABASE_ERROR,
      'Failed to fetch sports from database',
      { originalError: error.message }
    );
  }

  // Return empty array if no data
  return data ?? [];
}

