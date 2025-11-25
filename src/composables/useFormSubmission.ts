import { ref, computed } from 'vue'
import type { Ref } from 'vue'

type SubmissionState = 'idle' | 'processing' | 'success' | 'error'
type StatusVariant = 'info' | 'success' | 'error'

export interface FormSubmissionOptions<T, R> {
  onSubmit: (data: T) => Promise<R>
  onSuccess?: (result: R, message?: string) => void
  onError?: (error: unknown) => void
  successMessage?: string
  processingMessage?: string
}

export interface FormSubmissionReturn<T, R = void> {
  state: Ref<SubmissionState>
  message: Ref<string>
  variant: Ref<StatusVariant>
  isProcessing: Ref<boolean>
  isSuccess: Ref<boolean>
  isError: Ref<boolean>
  execute: (data: T) => Promise<R | undefined>
  reset: () => void
}

/**
 * Composable for managing form submission state.
 * Handles loading, success, and error states with consistent messaging.
 *
 * @example
 * ```ts
 * const submission = useFormSubmission({
 *   onSubmit: async (data) => await api.login(data),
 *   onSuccess: () => navigate('/dashboard'),
 *   successMessage: 'Zalogowano pomyślnie!'
 * });
 *
 * await submission.execute({ email, password });
 * ```
 */
export function useFormSubmission<T, R = void>(
  options: FormSubmissionOptions<T, R>,
): FormSubmissionReturn<T, R> {
  const state = ref<SubmissionState>('idle')
  const message = ref('')
  const variant = ref<StatusVariant>('info')

  const isProcessing = computed(() => state.value === 'processing')
  const isSuccess = computed(() => state.value === 'success')
  const isError = computed(() => state.value === 'error')

  const execute = async (data: T): Promise<R | undefined> => {
    state.value = 'processing'
    message.value = options.processingMessage ?? 'Przetwarzanie...'
    variant.value = 'info'

    try {
      const result = await options.onSubmit(data)

      state.value = 'success'
      message.value = options.successMessage ?? 'Operacja zakończona pomyślnie!'
      variant.value = 'success'

      options.onSuccess?.(result, message.value)
      return result
    } catch (error) {
      state.value = 'error'
      variant.value = 'error'

      if (error instanceof Error) {
        message.value = error.message
      } else {
        message.value = 'Wystąpił nieoczekiwany błąd.'
      }

      options.onError?.(error)
      throw error
    }
  }

  const reset = () => {
    state.value = 'idle'
    message.value = ''
    variant.value = 'info'
  }

  return {
    state,
    message,
    variant,
    isProcessing,
    isSuccess,
    isError,
    execute,
    reset,
  }
}

