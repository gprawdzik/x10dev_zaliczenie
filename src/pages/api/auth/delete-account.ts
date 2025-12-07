import type { APIRoute } from 'astro'

import { createSupabaseServerClient } from '../../../db/supabase.server.js'
import { AuthError, requireAuth } from '../../../middleware/requireAuth.js'

const jsonResponse = (payload: unknown, status = 200): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

export const prerender = false

export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const env = locals.runtime?.env ?? import.meta.env
    const { userId } = await requireAuth(request, { supabase: locals.supabase })
    const supabaseAdmin = createSupabaseServerClient({ useServiceKey: true }, env)

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (error) {
      console.error('Failed to delete user in Supabase Auth:', error)
      return jsonResponse(
        { error: { code: 'ACCOUNT_DELETE_FAILED', message: 'Failed to delete account' } },
        500
      )
    }

    return jsonResponse({ success: true, message: 'Account deleted successfully' }, 200)
  } catch (error) {
    if (error instanceof AuthError) {
      return jsonResponse(
        {
          error: {
            code: error.code,
            message: error.message,
            ...(error.details ? { details: error.details } : {}),
          },
        },
        401
      )
    }

    console.error('Unhandled error while deleting account:', error)
    return jsonResponse(
      { error: { code: 'INTERNAL_ERROR', message: 'Could not delete account' } },
      500
    )
  }
}


