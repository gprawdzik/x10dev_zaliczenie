import { createClient } from '@supabase/supabase-js'

import type { Database } from '../db/database.types.js'

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY

if (!supabaseUrl) {
  throw new Error('Missing env: PUBLIC_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing env: PUBLIC_SUPABASE_KEY')
}

/**
 * Client-side Supabase client with anon key (respects RLS policies)
 */
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey)


