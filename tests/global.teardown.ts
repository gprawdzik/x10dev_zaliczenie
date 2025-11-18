import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { FullConfig } from '@playwright/test';

import type { Database } from '../src/db/database.types.js';

type TeardownEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  e2eUserId: string | undefined;
  e2eUsername: string;
  e2ePassword: string;
  skipTeardown: boolean;
  debug: boolean;
  isCI: boolean;
};

type CleanupResult = {
  table: string;
  deleted: number;
};

type CleanupOperation = () => Promise<number>;

const MAX_RETRIES = parseInt(process.env.TEARDOWN_MAX_RETRIES ?? '3', 10);
const RETRY_DELAY_MS = parseInt(process.env.TEARDOWN_RETRY_DELAY_MS ?? '1000', 10);

const USER_SCOPED_TABLES = ['activities', 'ai_suggestions', 'goals'] as const;
type UserScopedTable = (typeof USER_SCOPED_TABLES)[number];

/**
 * Global teardown hook executed after the last Playwright test finishes.
 * Cleans up data created by the E2E user to keep the Supabase project tidy.
 */
export default async function globalTeardown(config: FullConfig): Promise<void> {
  const startedAt = Date.now();
  const env = resolveEnvironment();

  console.log('🧹 Starting global teardown...');

  if (env.skipTeardown) {
    console.log('⏭️  Teardown skipped because SKIP_TEARDOWN=true');
    return;
  }

  if (!env.e2eUserId) {
    console.warn('⚠️  E2E_USERNAME_ID is not defined. Skipping teardown.');
    return;
  }

  guardAgainstProductionDatabase(env.supabaseUrl);

  const cleanupResults: CleanupResult[] = [];

  try {
    const { supabase, userId } = await createAuthenticatedSupabaseClient(env);

    if (userId !== env.e2eUserId) {
      throw new Error(
        `Authenticated Supabase user (${userId}) does not match E2E_USERNAME_ID (${env.e2eUserId}).`
      );
    }

    logRuntimeContext(config, env, userId);

    for (const table of USER_SCOPED_TABLES) {
      const deleted = await deleteWithRetry(
        () => deleteUserScopedRecords(supabase, table, env.e2eUserId as string),
        table
      );

      cleanupResults.push({ table, deleted });
      console.log(`✅ Deleted ${deleted} record(s) from ${table}`);
    }
  } catch (error) {
    handleTeardownError(error, env.isCI);
    return;
  } finally {
    const durationMs = Date.now() - startedAt;
    console.log('📊 Teardown summary:', cleanupResults);
    console.log(`⏱️  Global teardown completed in ${durationMs}ms`);
  }
}

/**
 * Validates and returns all environment variables used by the teardown.
 */
function resolveEnvironment(): TeardownEnv {
  const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.PUBLIC_SUPABASE_KEY;
  const e2eUsername = process.env.E2E_USERNAME;
  const e2ePassword = process.env.E2E_PASSWORD;

  if (!supabaseUrl) {
    throw new Error('PUBLIC_SUPABASE_URL must be provided for teardown.');
  }

  if (!supabaseAnonKey) {
    throw new Error('PUBLIC_SUPABASE_KEY must be provided for teardown.');
  }

  if (!e2eUsername || !e2ePassword) {
    throw new Error('E2E_USERNAME and E2E_PASSWORD must be provided for teardown authentication.');
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    e2eUserId: process.env.E2E_USERNAME_ID,
    e2eUsername,
    e2ePassword,
    skipTeardown: process.env.SKIP_TEARDOWN === 'true',
    debug: process.env.DEBUG === 'true',
    isCI: process.env.CI === 'true',
  };
}

/**
 * Prevents accidental deletions on production databases.
 */
function guardAgainstProductionDatabase(supabaseUrl: string): void {
  const isProductionEnv = process.env.NODE_ENV === 'production';
  const looksLikeProdDb = !/test|staging|dev/i.test(supabaseUrl);

  if (isProductionEnv && looksLikeProdDb) {
    throw new Error('🛑 Teardown blocked: production database detected.');
  }
}

/**
 * Deletes records from tables that scope data by user_id.
 * @param supabase - Supabase client instance
 * @param table - Table name to delete from
 * @param userId - Target user identifier
 */
async function deleteUserScopedRecords(
  supabase: SupabaseClient<Database>,
  table: UserScopedTable,
  userId: string
): Promise<number> {
  const { error, count } = await supabase
    .from(table)
    .delete({ count: 'exact' })
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Error deleting records from ${table}: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Executes the provided cleanup function with retries.
 */
async function deleteWithRetry(operation: CleanupOperation, table: string): Promise<number> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        throw error;
      }

      const delay = RETRY_DELAY_MS * attempt;
      console.warn(`⚠️  Attempt ${attempt} to clean ${table} failed. Retrying in ${delay}ms...`);
      await delayMs(delay);
    }
  }

  return 0;
}

async function createAuthenticatedSupabaseClient(
  env: TeardownEnv
): Promise<{ supabase: SupabaseClient<Database>; userId: string }> {
  console.log(`🔐 Signing in teardown user ${env.e2eUsername}...`);

  const authClient = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await authClient.auth.signInWithPassword({
    email: env.e2eUsername,
    password: env.e2ePassword,
  });

  if (error) {
    throw new Error(`Failed to sign in teardown user: ${error.message}`);
  }

  const session = data.session;
  const user = data.user;

  if (!session?.access_token) {
    throw new Error('Supabase login did not return an access token.');
  }

  if (!user?.id) {
    throw new Error('Supabase login did not return a user id.');
  }

  const supabase = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    },
  });

  return { supabase, userId: user.id };
}

function handleTeardownError(error: unknown, shouldThrow: boolean): void {
  const message = error instanceof Error ? error.message : 'Unknown teardown error';
  console.error('❌ Teardown failed:', message);

  if (shouldThrow) {
    throw error instanceof Error ? error : new Error(message);
  }

  console.warn('⚠️  Continuing despite teardown failure (non-CI environment).');
}

function logRuntimeContext(config: FullConfig, env: TeardownEnv, authenticatedUserId?: string): void {
  console.log('🧾 Playwright config snapshot:', {
    baseURL: config.use?.baseURL,
    workers: config.workers,
    retries: config.retries,
  });

  if (env.debug) {
    console.log('🐞 Teardown environment variables:', {
      E2E_USERNAME_ID: env.e2eUserId,
      AUTHENTICATED_USER_ID: authenticatedUserId,
      PUBLIC_SUPABASE_URL: env.supabaseUrl,
      PUBLIC_SUPABASE_KEY_PRESENT: Boolean(env.supabaseAnonKey),
      E2E_USERNAME_PRESENT: Boolean(env.e2eUsername),
      SKIP_TEARDOWN: env.skipTeardown,
    });
  }
}

function delayMs(duration: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, duration));
}


