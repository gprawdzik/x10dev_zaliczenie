/// <reference types="vite/client" />

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './src/db/database.types';

declare global {
  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_KEY: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
