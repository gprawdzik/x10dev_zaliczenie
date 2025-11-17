import type { APIRoute } from 'astro'

import { passwordRecoverySchema } from '../../../validators/auth.js'
import { createSupabaseServerClient } from '../../../db/supabase.server.js'
import { getAuthErrorMessage } from '../../../lib/authErrors.js'

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })

export const POST: APIRoute = async ({ request }) => {
  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return jsonResponse({ error: 'Nieprawidłowe dane żądania' }, 400)
  }

  const validation = passwordRecoverySchema.safeParse(payload)

  if (!validation.success) {
    const validationMessage =
      validation.error.issues[0]?.message ?? 'Upewnij się, że adres email jest poprawny'

    return jsonResponse({ error: validationMessage }, 400)
  }

  const supabase = createSupabaseServerClient()
  const requestUrl = new URL(request.url)
  const redirectTo = `${requestUrl.origin}/auth/reset`

  const { error } = await supabase.auth.resetPasswordForEmail(validation.data.email, {
    redirectTo,
  })

  if (error) {
    console.error('Password recovery error:', error)
    return jsonResponse({ error: getAuthErrorMessage(error) }, 500)
  }

  return jsonResponse({
    message:
      'Jeżeli konto istnieje, wysłaliśmy na nie instrukcje resetu hasła. Sprawdź skrzynkę email.',
  })
}

