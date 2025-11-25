import type { SupabaseClient } from '@supabase/supabase-js'

import { supabaseClient } from '../db/supabase.client.js'

// Infer types from SupabaseClient to avoid direct imports from internal packages
type AuthChangeEvent = Parameters<Parameters<SupabaseClient['auth']['onAuthStateChange']>[0]>[0]
type Session = NonNullable<Awaited<ReturnType<SupabaseClient['auth']['getSession']>>['data']['session']>

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
   * Rejestruje nowego użytkownika i zwraca informacje o sesji
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

      return { user: data.user, session: data.session }
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

      // UWAGA: Usuwanie konta w Supabase wymaga specjalnej implementacji
      // Opcja 1: Wywołać RPC function która obsługuje usuwanie
      // Opcja 2: Wywołać dedykowany endpoint API
      // Opcja 3: Użyć admin API (tylko po stronie serwera)
      
      // Na potrzeby MVP używamy endpoint API
      const response = await fetch('/api/user/account', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      // Wyloguj użytkownika po usunięciu konta
      await supabaseClient.auth.signOut();

      return { success: true };
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  };

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

