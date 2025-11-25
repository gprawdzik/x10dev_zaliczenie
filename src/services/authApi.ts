export interface PasswordRecoveryResponse {
  message: string
}

/**
 * Custom error class for authentication API errors.
 * Preserves original error and HTTP status code for better error handling.
 */
export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown,
    public readonly statusCode?: number,
  ) {
    super(message)
    this.name = 'AuthApiError'
  }
}

/**
 * Centralized authentication API service.
 * Handles API calls related to authentication flows.
 */
export const authApi = {
  /**
   * Request password recovery email.
   * Sends a password reset link to the provided email address.
   *
   * @param email - User's email address
   * @returns Promise with success message
   * @throws AuthApiError on failure
   *
   * @example
   * ```ts
   * try {
   *   const result = await authApi.requestPasswordRecovery('user@example.com');
   *   console.log(result.message);
   * } catch (error) {
   *   if (error instanceof AuthApiError) {
   *     console.error(error.message, error.statusCode);
   *   }
   * }
   * ```
   */
  async requestPasswordRecovery(email: string): Promise<PasswordRecoveryResponse> {
    try {
      const response = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string
        message?: string
      }

      if (!response.ok) {
        throw new AuthApiError(
          payload?.error ?? 'Nie udało się wysłać instrukcji resetu.',
          null,
          response.status,
        )
      }

      return {
        message:
          payload?.message ??
          'Jeżeli konto istnieje, wysłaliśmy na nie instrukcje resetu. Sprawdź skrzynkę email.',
      }
    } catch (error) {
      if (error instanceof AuthApiError) {
        throw error
      }

      throw new AuthApiError(
        'Nie udało się połączyć z serwerem. Spróbuj ponownie.',
        error,
      )
    }
  },
}

