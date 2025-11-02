# Supabase VUE 3 Initialization

This document provides a reproducible guide to create the necessary file structure for integrating Supabase with your Astro project.

## Prerequisites

- Your project should use VUE 3, TypeScript 5, and Tailwind 4.
- Install the `@supabase/supabase-js` package.
- Ensure that `/supabase/config.toml` exists
- Ensure that a file `/src/db/database.types.ts` exists and contains the correct type definitions for your database.

IMPORTANT: Check prerequisites before perfoming actions below. If they're not met, stop and ask a user for the fix.

## File Structure and Setup

### 1. Supabase Client Initialization

Create the file `/src/db/supabase.client.ts` with the following content:

```ts
import { createClient } from '@supabase/supabase-js'

import type { Database } from '../db/database.types.ts'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

This file initializes the Supabase client using the environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY`.

### 2. Middleware Setup

Create the file `/src/plugins/supabase.ts` with the following content:

```
import { App } from 'vue'
import { supabaseClient } from '../db/supabase.client'

export default {
  install(app: App) {
    app.config.globalProperties.$supabase = supabaseClient
  },
}

```

This middleware adds the Supabase client to the VUE context locals, making it available throughout your application.

### 3. TypeScript Environment Definitions

Create the file `src/env.d.ts` with the following content:

```ts
/// <reference types="vite/client" />

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './db/database.types'

declare global {
  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string
    readonly VITE_SUPABASE_KEY: string
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}
```

This file augments the global types to include the Supabase client on the VUE object, ensuring proper typing throughout your application.
