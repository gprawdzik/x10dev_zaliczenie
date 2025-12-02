/// <reference path="../../env.supabase-ssr.d.ts" />
import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr/dist/module/createBrowserClient.js'
import type { SerializeOptions } from 'cookie'

import type { Database } from '../db/database.types.js'

type CookieOptions = Partial<SerializeOptions>

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY

if (!supabaseUrl) {
  throw new Error('Missing env: PUBLIC_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing env: PUBLIC_SUPABASE_KEY')
}

const isBrowser = typeof window !== 'undefined'

const supabaseBrowserClient = () =>
  createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return readBrowserCookie(name)
      },
      set(name: string, value: string, options: CookieOptions) {
        writeBrowserCookie(name, value, options)
      },
      remove(name: string, options: CookieOptions) {
        deleteBrowserCookie(name, options)
      },
    },
  })

/**
 * Client-side Supabase client with anon key (respects RLS policies)
 * In the browser we use @supabase/ssr helper to keep auth cookies in sync
 * with Astro middleware. On the server we fall back to the standard client.
 */
export const supabaseClient = isBrowser ? supabaseBrowserClient() : createClient<Database>(supabaseUrl, supabaseAnonKey)

function readBrowserCookie(name: string): string | undefined {
  if (!isBrowser) {
    return undefined
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : undefined
}

function writeBrowserCookie(name: string, value: string, options: CookieOptions = {}) {
  if (!isBrowser) {
    return
  }

  document.cookie = serializeCookie(name, value, options)
}

function deleteBrowserCookie(name: string, options: CookieOptions = {}) {
  if (!isBrowser) {
    return
  }

  document.cookie = serializeCookie(name, '', {
    ...options,
    maxAge: 0,
    expires: new Date(0),
  })
}

function serializeCookie(name: string, value: string, options: CookieOptions = {}): string {
  const segments = [`${name}=${encodeURIComponent(value)}`]

  if (options.maxAge !== undefined) {
    segments.push(`Max-Age=${options.maxAge}`)
  }

  if (options.expires) {
    const expires = options.expires instanceof Date ? options.expires : new Date(options.expires)
    segments.push(`Expires=${expires.toUTCString()}`)
  }

  segments.push(`Path=${options.path ?? '/'}`)

  if (options.domain) {
    segments.push(`Domain=${options.domain}`)
  }

  if (options.sameSite) {
    segments.push(`SameSite=${options.sameSite}`)
  }

  if (options.secure) {
    segments.push('Secure')
  }

  return segments.join('; ')
}


