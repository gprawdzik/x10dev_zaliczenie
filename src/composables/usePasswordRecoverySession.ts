import { ref, onMounted } from 'vue'
import { supabaseClient } from '@/db/supabase.client.js'
import { getAuthErrorMessage } from '@/lib/authErrors.js'

type SessionState = 'checking' | 'ready' | 'invalid'

/**
 * Composable for managing password recovery session establishment.
 * Handles URL parameter extraction, code exchange, and session validation.
 *
 * Used by PasswordResetForm to establish recovery session from email link.
 *
 * @example
 * ```ts
 * const { state, errorMessage, isReady } = usePasswordRecoverySession();
 *
 * if (isReady()) {
 *   // Allow user to set new password
 * }
 * ```
 */
export function usePasswordRecoverySession() {
  const state = ref<SessionState>('checking')
  const errorMessage = ref('')

  /**
   * Remove authentication parameters from URL after successful session establishment.
   * Cleans up both query params and hash fragments.
   */
  const removeAuthParamsFromUrl = () => {
    if (typeof window === 'undefined') {
      return
    }

    const url = new URL(window.location.href)
    url.searchParams.delete('code')
    window.history.replaceState({}, document.title, url.pathname)
    window.location.hash = ''
  }

  /**
   * Establish recovery session from URL parameters.
   * Tries two methods:
   * 1. Exchange 'code' query parameter for session (PKCE flow)
   * 2. Use access_token and refresh_token from hash (legacy flow)
   */
  const establishSession = async () => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const currentUrl = new URL(window.location.href)
      const code = currentUrl.searchParams.get('code')

      // Method 1: PKCE flow with code exchange
      if (code) {
        const { error } = await supabaseClient.auth.exchangeCodeForSession(code)

        if (error) {
          throw error
        }

        state.value = 'ready'
        removeAuthParamsFromUrl()
        return
      }

      // Method 2: Legacy flow with tokens in hash
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (accessToken && refreshToken) {
        const { error } = await supabaseClient.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (error) {
          throw error
        }

        state.value = 'ready'
        removeAuthParamsFromUrl()
        return
      }

      // No valid authentication method found
      throw new Error(
        'Link resetujący jest nieprawidłowy lub wygasł. Użyj ponownie opcji odzyskiwania konta.',
      )
    } catch (error) {
      console.error('Password reset session error:', error)
      state.value = 'invalid'
      errorMessage.value =
        getAuthErrorMessage(error) || 'Nie udało się zweryfikować linku resetującego.'
    }
  }

  // Establish session on component mount
  onMounted(establishSession)

  return {
    state,
    errorMessage,
    isReady: () => state.value === 'ready',
    isInvalid: () => state.value === 'invalid',
    isChecking: () => state.value === 'checking',
  }
}

