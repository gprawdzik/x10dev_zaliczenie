<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToastStore } from '@/stores/toast';
import { useAuth } from '@/composables/useAuth';

// Stan ładowania podczas usuwania konta
const isDeleting = ref(false);
// Stan otwarcia modala
const isDialogOpen = ref(false);

// Toast store do wyświetlania powiadomień
const toast = useToastStore();

// Auth composable do operacji na użytkowniku
const { deleteAccount } = useAuth();

/**
 * Obsługa potwierdzenia usunięcia konta
 * Wysyła żądanie do API i przekierowuje użytkownika po sukcesie
 */
const handleDeleteAccount = async () => {
  isDeleting.value = true;

  try {
    // Wywołaj funkcję usuwania konta (wyloguje automatycznie)
    await deleteAccount();

    // Wyświetl powiadomienie sukcesu
    toast.success('Konto zostało usunięte', 'Zostaniesz wylogowany');
    
    isDialogOpen.value = false;

    // Przekieruj na stronę główną po krótkiej chwili
    setTimeout(() => {
      window.location.href = '/';
    }, 1500);

  } catch (error: unknown) {
    console.error('Błąd podczas usuwania konta:', error);
    
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Wystąpił błąd podczas usuwania konta. Spróbuj ponownie.';
    toast.error('Błąd usuwania konta', errorMessage);
  } finally {
    isDeleting.value = false;
  }
};
</script>

<template>
  <div class="account-delete-section">
    <div class="account-delete-section__text">
      <p class="text-sm text-muted-foreground">
        Po usunięciu konta wszystkie Twoje dane, w tym cele, aktywności i historia zmian,
        zostaną trwale usunięte. Ta operacja jest nieodwracalna.
      </p>
    </div>

    <!-- Dialog (modal) z potwierdzeniem -->
    <Dialog v-model:open="isDialogOpen">
      <!-- Przycisk otwierający modal -->
      <div class="account-delete-section__actions">
        <DialogTrigger as-child>
          <Button variant="destructive">
            <span>Usuń konto</span>
          </Button>
        </DialogTrigger>
      </div>

      <!-- Zawartość modala -->
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Czy na pewno chcesz usunąć konto?</DialogTitle>
          <DialogDescription>
            Ta operacja jest nieodwracalna. Wszystkie Twoje dane zostaną trwale usunięte
            i nie będzie możliwości ich odzyskania.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <!-- Przycisk anuluj -->
          <DialogClose as-child>
            <Button variant="outline" :disabled="isDeleting">
              Anuluj
            </Button>
          </DialogClose>

          <!-- Przycisk potwierdź usunięcie -->
          <Button
            variant="destructive"
            :disabled="isDeleting"
            @click="handleDeleteAccount"
          >
            {{ isDeleting ? 'Usuwam...' : 'Tak, usuń konto' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
.account-delete-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.account-delete-section__text {
  font-size: 0.875rem;
  line-height: 1.5;
}

.account-delete-section__actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 0.5rem;
}
</style>

