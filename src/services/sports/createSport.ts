import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types.js';
import type { CreateSportCommand } from '../../validators/createSport.js';
import type { SportDto } from '../../types.js';

/**
 * Error codes specific to sport creation
 */
export const SportCreationErrors = {
  DUPLICATE_CODE: 'duplicate_code',
  DATABASE_ERROR: 'database_error',
  UNAUTHORIZED: 'unauthorized',
} as const;

/**
 * Custom error class for sport creation failures
 */
export class SportCreationError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'SportCreationError';
  }
}

/**
 * Creates a new sport in the database.
 *
 * This function performs the following steps:
 * 1. Validates that the command contains all required data (caller should validate with Zod first)
 * 2. Attempts to insert the sport into the database using authenticated client
 * 3. Handles duplicate code errors (unique constraint violation)
 * 4. Returns the created sport with all database-generated fields
 *
 * @param client - Authenticated Supabase client (respects RLS policies)
 * @param command - Validated command object containing sport data
 * @returns Promise resolving to the created sport DTO
 * @throws SportCreationError if the operation fails
 */
export async function createSport(client: SupabaseClient<Database>, command: CreateSportCommand): Promise<SportDto> {
  if (!client) {
    throw new SportCreationError(
      SportCreationErrors.DATABASE_ERROR,
      'Supabase client is not initialized'
    );
  }

  // Prepare the data for insertion
  const sportData = {
    code: command.code,
    name: command.name,
    description: command.description ?? null,
  };

  // Attempt to insert the sport
  const { data, error } = await client
    .from('sports')
    .insert(sportData)
    .select()
    .single();

  // Handle errors
  if (error) {
    // Check for unique constraint violation (duplicate code)
    if (error.code === '23505' || error.message.includes('unique')) {
      throw new SportCreationError(
        SportCreationErrors.DUPLICATE_CODE,
        `Sport with code "${command.code}" already exists`,
        { code: command.code }
      );
    }

    // Check for authorization errors
    if (error.code === 'PGRST301' || error.message.includes('permission')) {
      throw new SportCreationError(
        SportCreationErrors.UNAUTHORIZED,
        'Insufficient permissions to create sport',
        { originalError: error.message }
      );
    }

    // Generic database error
    console.error('Failed to create sport:', error);
    throw new SportCreationError(
      SportCreationErrors.DATABASE_ERROR,
      'Failed to create sport due to database error',
      { originalError: error.message }
    );
  }

  // Ensure we got data back
  if (!data) {
    throw new SportCreationError(
      SportCreationErrors.DATABASE_ERROR,
      'Sport was created but no data was returned'
    );
  }

  return data;
}

