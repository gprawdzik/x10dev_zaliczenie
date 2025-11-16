import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/db/database.types.js'

type ServerClientOptions = {
  /**
   * Use the service role key instead of the anon key.
   * Should only be enabled for trusted backend contexts.
   */
  useServiceKey?: boolean
}

function assertEnv(value: string | undefined, key: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}

const supabaseUrl = assertEnv(import.meta.env.PUBLIC_SUPABASE_URL, 'PUBLIC_SUPABASE_URL')
const supabaseAnonKey = assertEnv(import.meta.env.PUBLIC_SUPABASE_KEY, 'PUBLIC_SUPABASE_KEY')

export function createSupabaseServerClient(
  options: ServerClientOptions = {}
): SupabaseClient<Database> {
  const key = options.useServiceKey
    ? assertEnv(import.meta.env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY')
    : supabaseAnonKey

  return createClient<Database>(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

