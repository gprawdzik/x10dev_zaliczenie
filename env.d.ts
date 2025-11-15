/// <reference types="astro/client" />

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './src/db/database.types.js'

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>
    }
  }
}

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string
  readonly PUBLIC_SUPABASE_KEY: string
  readonly PUBLIC_SUPABASE_GENERATOR_USER_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
