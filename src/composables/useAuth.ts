import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '../db/database.types.js'
import { supabaseClient } from '../db/supabase.client.js'

// Infer types from SupabaseClient to avoid direct imports from internal packages
// Using a helper type to extract the callback parameter type
type OnAuthStateChangeCallback = SupabaseClient<Database>['auth']['onAuthStateChange'] extends (
  callback: infer C
) => unknown
  ? C extends (event: infer E, session: infer S) => unknown
    ? { event: E; session: S }
    : never
  : never

type AuthChangeEvent = OnAuthStateChangeCallback['event']
type Session = NonNullable<OnAuthStateChangeCallback['session']>

const getEmailRedirectUrl = () => {
  if (typeof window === 'undefined') {
    return undefined
  }

  return `${window.location.origin}/auth/callback`
}

/**
 * Composable do zarządzania autentykacją użytkownika
 * Wykorzystuje Supabase Auth
 */
export function useAuth() {
  /**
   * Rejestruje nowego użytkownika bez pozostawiania aktywnej sesji.
   * Użytkownik musi potwierdzić konto z linku aktywacyjnego.
   */
  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getEmailRedirectUrl(),
        },
      })

      if (error) {
        throw error
      }

      // Jeśli Supabase utworzyło sesję, natychmiast ją unieważniamy.
      if (data.session) {
        const { error: signOutError } = await supabaseClient.auth.signOut()

        if (signOutError) {
          throw signOutError
        }
      }

      // Zwracamy wynik bez sesji – wymagane jest potwierdzenie email.
      return { user: data.user, session: null }
    } catch (error) {
      console.error('Error signing up:', error)
      throw error
    }
  }

  /**
   * Loguje użytkownika przy użyciu emaila i hasła
   */
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      return { user: data.user, session: data.session }
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    }
  }

  /**
   * Zmienia hasło użytkownika
   * Używa JWT tokena do weryfikacji tożsamości użytkownika (nie wymaga obecnego hasła)
   * @param newPassword - Nowe hasło
   * @returns Promise z wynikiem operacji
   */
  const changePassword = async (newPassword: string) => {
    try {
      // Supabase Auth nie wymaga obecnego hasła dla zalogowanego użytkownika
      // Weryfikacja następuje przez JWT token z aktywnej sesji
      const { error } = await supabaseClient.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  };

  /**
   * Usuwa konto użytkownika
   * UWAGA: Ta operacja wymaga uprawnień admin lub odpowiedniej funkcji RPC w Supabase
   * W prostej implementacji można użyć soft delete lub funkcji edge
   */
  const deleteAccount = async () => {
    try {
      // Pobierz aktualnego użytkownika
      const { data: { user } } = await supabaseClient.auth.getUser();

      if (!user) {
        throw new Error('No user logged in');
      }

      // Usuwamy konto przez serwerowy endpoint korzystający z Supabase admin API
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          (errorBody as { error?: { message?: string } } | null)?.error?.message ??
          'Failed to delete account'
        throw new Error(message)
      }

      // Wyloguj użytkownika po usunięciu konta
      await supabaseClient.auth.signOut()

      return { success: true }
    } catch (error) {
      console.error('Error deleting account:', error)
      throw error
    }
  }

  /**
   * Wylogowuje użytkownika
   */
  const signOut = async () => {
    try {
      const { error } = await supabaseClient.auth.signOut()
      
      if (error) {
        throw error
      }

      return { success: true }
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  /**
   * Pobiera aktualnie zalogowanego użytkownika
   */
  const getCurrentUser = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabaseClient.auth.getUser()
      
      if (error) {
        throw error
      }

      return user
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  /**
   * Sprawdza, czy użytkownik posiada aktywną sesję
   */
  const isAuthenticated = async (): Promise<boolean> => {
    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession()

      return Boolean(session)
    } catch (error) {
      console.error('Error checking authentication:', error)
      return false
    }
  }

  /**
   * Subskrybuje zmiany stanu autentykacji
   */
  const onAuthStateChange = (
    callback: (event: AuthChangeEvent, session: Session | null) => void
  ) => {
    return supabaseClient.auth.onAuthStateChange(callback)
  }

  return {
    signUp,
    signIn,
    isAuthenticated,
    onAuthStateChange,
    changePassword,
    deleteAccount,
    signOut,
    getCurrentUser,
  }
}

