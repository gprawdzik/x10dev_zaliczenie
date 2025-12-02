// Type declarations for @supabase/ssr module imports
// This file helps TypeScript resolve imports from internal package paths

import type { SupabaseClient, SupabaseClientOptions } from '@supabase/supabase-js'

type CookieOptions = Partial<{
  maxAge?: number
  expires?: Date | string
  path?: string
  domain?: string
  sameSite?: 'strict' | 'lax' | 'none'
  secure?: boolean
}>

type CookieMethodsBrowser = {
  getAll: () => Promise<{ name: string; value: string }[] | null> | { name: string; value: string }[] | null
  setAll: (cookies: { name: string; value: string; options?: CookieOptions }[]) => Promise<void> | void
}

type CookieMethodsBrowserDeprecated = {
  get: (name: string) => Promise<string | null | undefined> | string | null | undefined
  set: (name: string, value: string, options?: CookieOptions) => Promise<void> | void
  remove: (name: string, options?: CookieOptions) => Promise<void> | void
}

type CookieMethodsServer = {
  getAll: () => Promise<{ name: string; value: string }[] | null> | { name: string; value: string }[] | null
  setAll?: (cookies: { name: string; value: string; options?: CookieOptions }[]) => Promise<void> | void
}

type CookieMethodsServerDeprecated = {
  get: (name: string) => Promise<string | null | undefined> | string | null | undefined
  set?: (name: string, value: string, options?: CookieOptions) => Promise<void> | void
  remove?: (name: string, options?: CookieOptions) => Promise<void> | void
}

type CookieOptionsWithName = {
  name?: string
} & CookieOptions

declare module '@supabase/ssr/dist/module/createBrowserClient' {
  export function createBrowserClient<Database = any, SchemaName extends string & keyof Omit<Database, '__InternalSupabase'> = 'public' extends keyof Omit<Database, '__InternalSupabase'> ? 'public' : string & keyof Omit<Database, '__InternalSupabase'>>(
    supabaseUrl: string,
    supabaseKey: string,
    options?: SupabaseClientOptions<SchemaName> & {
      cookies?: CookieMethodsBrowser
      cookieOptions?: CookieOptionsWithName
      cookieEncoding?: 'raw' | 'base64url'
      isSingleton?: boolean
    }
  ): SupabaseClient<Database, SchemaName>

  export function createBrowserClient<Database = any, SchemaName extends string & keyof Omit<Database, '__InternalSupabase'> = 'public' extends keyof Omit<Database, '__InternalSupabase'> ? 'public' : string & keyof Omit<Database, '__InternalSupabase'>>(
    supabaseUrl: string,
    supabaseKey: string,
    options?: SupabaseClientOptions<SchemaName> & {
      cookies: CookieMethodsBrowserDeprecated
      cookieOptions?: CookieOptionsWithName
      cookieEncoding?: 'raw' | 'base64url'
      isSingleton?: boolean
    }
  ): SupabaseClient<Database, SchemaName>
}

declare module '@supabase/ssr/dist/module/createBrowserClient.js' {
  export * from '@supabase/ssr/dist/module/createBrowserClient'
}

declare module '@supabase/ssr/dist/module/createServerClient' {
  export function createServerClient<Database = any, SchemaName extends string & keyof Omit<Database, '__InternalSupabase'> = 'public' extends keyof Omit<Database, '__InternalSupabase'> ? 'public' : string & keyof Omit<Database, '__InternalSupabase'>>(
    supabaseUrl: string,
    supabaseKey: string,
    options: SupabaseClientOptions<SchemaName> & {
      cookies: CookieMethodsServer
      cookieOptions?: CookieOptionsWithName
      cookieEncoding?: 'raw' | 'base64url'
    }
  ): SupabaseClient<Database, SchemaName>

  export function createServerClient<Database = any, SchemaName extends string & keyof Omit<Database, '__InternalSupabase'> = 'public' extends keyof Omit<Database, '__InternalSupabase'> ? 'public' : string & keyof Omit<Database, '__InternalSupabase'>>(
    supabaseUrl: string,
    supabaseKey: string,
    options: SupabaseClientOptions<SchemaName> & {
      cookies: CookieMethodsServerDeprecated
      cookieOptions?: CookieOptionsWithName
      cookieEncoding?: 'raw' | 'base64url'
    }
  ): SupabaseClient<Database, SchemaName>
}

declare module '@supabase/ssr/dist/module/createServerClient.js' {
  export function createServerClient<Database = any, SchemaName extends string & keyof Omit<Database, '__InternalSupabase'> = 'public' extends keyof Omit<Database, '__InternalSupabase'> ? 'public' : string & keyof Omit<Database, '__InternalSupabase'>>(
    supabaseUrl: string,
    supabaseKey: string,
    options: SupabaseClientOptions<SchemaName> & {
      cookies: CookieMethodsServer
      cookieOptions?: CookieOptionsWithName
      cookieEncoding?: 'raw' | 'base64url'
    }
  ): SupabaseClient<Database, SchemaName>

  export function createServerClient<Database = any, SchemaName extends string & keyof Omit<Database, '__InternalSupabase'> = 'public' extends keyof Omit<Database, '__InternalSupabase'> ? 'public' : string & keyof Omit<Database, '__InternalSupabase'>>(
    supabaseUrl: string,
    supabaseKey: string,
    options: SupabaseClientOptions<SchemaName> & {
      cookies: CookieMethodsServerDeprecated
      cookieOptions?: CookieOptionsWithName
      cookieEncoding?: 'raw' | 'base64url'
    }
  ): SupabaseClient<Database, SchemaName>
}

