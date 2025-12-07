import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/db/database.types.js'

type ServerClientOptions = {
  /**
   * Use the service role key instead of the anon key.
   * Should only be enabled for trusted backend contexts.
   */
  useServiceKey?: boolean
}

type RuntimeEnv = {
  PUBLIC_SUPABASE_URL?: string
  PUBLIC_SUPABASE_KEY?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  // Allow additional keys when passed from runtime bindings
  [key: string]: string | undefined
}

function assertEnv(value: string | undefined, key: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}

export function createSupabaseServerClient(
  options: ServerClientOptions = {},
  env: RuntimeEnv = import.meta.env
): SupabaseClient<Database> {
  const fromEnv = (key: string) => env?.[key] ?? process.env?.[key]

  const supabaseUrl = assertEnv(fromEnv('PUBLIC_SUPABASE_URL'), 'PUBLIC_SUPABASE_URL')
  const supabaseAnonKey = assertEnv(fromEnv('PUBLIC_SUPABASE_KEY'), 'PUBLIC_SUPABASE_KEY')

  const key = options.useServiceKey
    ? assertEnv(fromEnv('SUPABASE_SERVICE_ROLE_KEY'), 'SUPABASE_SERVICE_ROLE_KEY')
    : supabaseAnonKey

  return createClient<Database>(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

