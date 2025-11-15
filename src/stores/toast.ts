import { defineStore } from 'pinia';
import { toast as sonnerToast } from 'vue-sonner';

/**
 * Store do zarządzania globalnymi powiadomieniami Toast
 * Używa vue-sonner jako silnika do wyświetlania powiadomień
 */
export const useToastStore = defineStore('toast', () => {
  /**
   * Wyświetla powiadomienie sukcesu
   * @param message - Treść powiadomienia
   * @param description - Opcjonalny opis
   */
  const success = (message: string, description?: string) => {
    sonnerToast.success(message, {
      description,
      duration: 4000,
    });
  };

  /**
   * Wyświetla powiadomienie błędu
   * @param message - Treść powiadomienia
   * @param description - Opcjonalny opis
   */
  const error = (message: string, description?: string) => {
    sonnerToast.error(message, {
      description,
      duration: 5000,
    });
  };

  /**
   * Wyświetla powiadomienie informacyjne
   * @param message - Treść powiadomienia
   * @param description - Opcjonalny opis
   */
  const info = (message: string, description?: string) => {
    sonnerToast.info(message, {
      description,
      duration: 4000,
    });
  };

  /**
   * Wyświetla powiadomienie ostrzeżenia
   * @param message - Treść powiadomienia
   * @param description - Opcjonalny opis
   */
  const warning = (message: string, description?: string) => {
    sonnerToast.warning(message, {
      description,
      duration: 4000,
    });
  };

  /**
   * Wyświetla powiadomienie ładowania
   * @param message - Treść powiadomienia
   * @returns ID powiadomienia, które można użyć do jego zamknięcia
   */
  const loading = (message: string) => {
    return sonnerToast.loading(message);
  };

  /**
   * Wyświetla podstawowe powiadomienie
   * @param message - Treść powiadomienia
   * @param description - Opcjonalny opis
   */
  const message = (message: string, description?: string) => {
    sonnerToast(message, {
      description,
      duration: 4000,
    });
  };

  /**
   * Zamyka powiadomienie o określonym ID
   * @param toastId - ID powiadomienia do zamknięcia
   */
  const dismiss = (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  };

  return {
    success,
    error,
    info,
    warning,
    loading,
    message,
    dismiss,
  };
});

