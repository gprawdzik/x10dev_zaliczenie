type AuthErrorDictionary = Record<string, string>

export const authErrorMessages: AuthErrorDictionary = {
  // Registration
  'User already registered': 'Konto z tym adresem email już istnieje. Spróbuj się zalogować.',
  'Email not confirmed': 'Potwierdź swój adres email, zanim przejdziesz do logowania.',
  'Signup disabled': 'Rejestracja jest tymczasowo niedostępna. Spróbuj ponownie później.',

  // Login
  'Invalid login credentials': 'Nieprawidłowy email lub hasło.',
  'Too many requests': 'Zbyt wiele prób logowania. Spróbuj ponownie za kilka minut.',

  // Generic
  'Auth session missing':
    'Sesja wygasła lub jest niedostępna. Odśwież stronę i spróbuj ponownie.',
  'Network error': 'Błąd połączenia. Sprawdź internet i spróbuj ponownie.',
  'Internal server error': 'Wystąpił błąd serwera. Spróbuj ponownie później.',
}

const fallbackMessage = 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.'

type ErrorShape = {
  message?: string
}

function extractErrorMessage(error: unknown): string | undefined {
  if (typeof error === 'string') {
    return error
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return (error as ErrorShape).message
  }

  return undefined
}

export function getAuthErrorMessage(error: unknown): string {
  const message = extractErrorMessage(error)
  if (!message) {
    return fallbackMessage
  }

  return authErrorMessages[message] ?? fallbackMessage
}

