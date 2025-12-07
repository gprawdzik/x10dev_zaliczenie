/// <reference types="astro/client" />

import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from './src/db/database.types.js'

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>
      user: User | null
      runtime?: {
        env?: Record<string, string | undefined>
      }
    }
  }
}

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string
  readonly PUBLIC_SUPABASE_KEY: string
  readonly SUPABASE_SERVICE_ROLE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
