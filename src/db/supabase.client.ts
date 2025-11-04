import { createClient } from '@supabase/supabase-js'

import type { Database } from '../db/database.types.js'

const supabaseUrl = import.meta.env.SUPABASE_URL
const supabaseAnonKey = import.meta.env.SUPABASE_KEY

/**
 * Client-side Supabase client with anon key (respects RLS policies)
 */
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey)


