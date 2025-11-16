<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToastStore } from '@/stores/toast'
import { useAuth } from '@/composables/useAuth'
import { changePasswordSchema } from '@/validators/auth'
import { getAuthErrorMessage } from '@/lib/authErrors'
import { ZodError } from 'zod'

// Typ ViewModel dla formularza (bez currentPassword - używamy JWT do weryfikacji)
interface PasswordChangeViewModel {
  newPassword: string
  confirmNewPassword: string
}

// Stan formularza
const form = reactive<PasswordChangeViewModel>({
  newPassword: '',
  confirmNewPassword: '',
})

// Stan ładowania i błędów
const isLoading = ref(false)
const errors = reactive<Partial<Record<keyof PasswordChangeViewModel | 'general', string>>>({})

// Toast store do wyświetlania powiadomień
const toast = useToastStore()

// Auth composable do operacji na użytkowniku
const { changePassword } = useAuth()

/**
 * Walidacja formularza po stronie klienta przy użyciu Zod
 * Zwraca true jeśli formularz jest poprawny, false w przeciwnym razie
 */
const validateForm = (): boolean => {
  // Wyczyść poprzednie błędy
  Object.keys(errors).forEach((key) => delete errors[key as keyof typeof errors])

  try {
    // Walidacja przez Zod schema
    changePasswordSchema.parse(form)
    return true
  } catch (error) {
    // Obsługa błędów walidacji Zod
    if (error instanceof ZodError) {
      // Mapowanie błędów Zod na obiekt errors
      error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof PasswordChangeViewModel
        if (path && !errors[path]) {
          errors[path] = issue.message
        }
      })
    }
    return false
  }
}

/**
 * Obsługa wysłania formularza
 * Waliduje dane przy użyciu Zod i wysyła żądanie do Supabase Auth
 */
const handleSubmit = async () => {
  // Walidacja przed wysłaniem
  if (!validateForm()) {
    return
  }

  isLoading.value = true
  errors.general = ''

  try {
    // Wywołaj Supabase Auth do zmiany hasła (bez obecnego hasła - weryfikacja przez JWT)
    await changePassword(form.newPassword)

    // Sukces - wyczyść formularz
    form.newPassword = ''
    form.confirmNewPassword = ''

    // Wyświetl powiadomienie sukcesu
    toast.success('Hasło zostało zmienione', 'Twoje hasło zostało pomyślnie zaktualizowane')
  } catch (error: unknown) {
    console.error('Błąd podczas zmiany hasła:', error)

    // Użyj centralnej funkcji mapowania błędów Supabase na przyjazne komunikaty
    const errorMessage = getAuthErrorMessage(error)

    toast.error('Błąd zmiany hasła', errorMessage)
    errors.general = errorMessage
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="flex flex-col gap-6">
    <!-- Pole: Nowe hasło -->
    <div class="flex flex-col gap-3">
      <Label for="new-password">Nowe hasło</Label>
      <Input
        id="new-password"
        v-model="form.newPassword"
        type="password"
        :disabled="isLoading"
        placeholder="Wprowadź nowe hasło"
        :class="{ 'border-red-500': errors.newPassword }"
      />
      <p v-if="errors.newPassword" class="text-sm text-red-500">
        {{ errors.newPassword }}
      </p>
      <p class="text-xs text-gray-500">
        Hasło musi zawierać: min. 10 znaków, wielką literę, małą literę oraz cyfrę
      </p>
    </div>

    <!-- Pole: Potwierdź nowe hasło -->
    <div class="flex flex-col gap-3">
      <Label for="confirm-password">Potwierdź nowe hasło</Label>
      <Input
        id="confirm-password"
        v-model="form.confirmNewPassword"
        type="password"
        :disabled="isLoading"
        placeholder="Wprowadź ponownie nowe hasło"
        :class="{ 'border-red-500': errors.confirmNewPassword }"
      />
      <p v-if="errors.confirmNewPassword" class="text-sm text-red-500">
        {{ errors.confirmNewPassword }}
      </p>
    </div>

    <!-- Błąd ogólny -->
    <p v-if="errors.general" class="text-sm text-red-500">
      {{ errors.general }}
    </p>

    <!-- Przycisk submit -->
    <div class="flex justify-end pt-2">
      <Button type="submit" :disabled="isLoading">
        {{ isLoading ? 'Zmieniam hasło...' : 'Zmień hasło' }}
      </Button>
    </div>
  </form>
</template>
