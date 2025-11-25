import { defineMiddleware } from 'astro:middleware'
import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/db/database.types.js'

const protectedRoutes = [
  '/',
  '/settings',
  '/goals',
  '/activities',
  '/progress',
  '/api/goals',
  '/api/activities',
  '/api/activities-generate',
  '/api/goal_history',
]

const authOnlyRoutes = ['/auth/login', '/auth/register']

const buildRouteMatcher = (routes: string[]) => {
  return (pathname: string) =>
    routes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

const isProtected = buildRouteMatcher(protectedRoutes)
const isAuthOnly = buildRouteMatcher(authOnlyRoutes)

function assertEnv(value: string | undefined, key: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

export const onRequest = defineMiddleware(async ({ request, locals, cookies, redirect }, next) => {
  const supabase = createServerClient<Database>(
    assertEnv(import.meta.env.PUBLIC_SUPABASE_URL, 'PUBLIC_SUPABASE_URL'),
    assertEnv(import.meta.env.PUBLIC_SUPABASE_KEY, 'PUBLIC_SUPABASE_KEY'),
    {
      cookies: {
        get(key: string) {
          return cookies.get(key)?.value
        },
        set(key: string, value: string, options: CookieOptions) {
          cookies.set(key, value, options)
        },
        remove(key: string, options: CookieOptions) {
          cookies.delete(key, options)
        },
      },
    }
  )

  locals.supabase = supabase as SupabaseClient<Database>

  const {
    data: { session },
  } = await supabase.auth.getSession()

  locals.user = session?.user ?? null

  const url = new URL(request.url)
  const pathname = url.pathname

  if (!session && isProtected(pathname)) {
    const redirectTo = `/auth/login?redirect=${encodeURIComponent(pathname)}`
    return redirect(redirectTo)
  }

  if (session && isAuthOnly(pathname)) {
    return redirect('/')
  }

  return next()
})

