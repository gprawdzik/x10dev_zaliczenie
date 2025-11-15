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

// Stan ładowania podczas usuwania konta
const isDeleting = ref(false);
// Stan otwarcia modala
const isDialogOpen = ref(false);

// Toast store do wyświetlania powiadomień
const toast = useToastStore();

/**
 * Obsługa potwierdzenia usunięcia konta
 * Wysyła żądanie do API i przekierowuje użytkownika po sukcesie
 */
const handleDeleteAccount = async () => {
  isDeleting.value = true;

  try {
    // TODO: Implementacja prawdziwego API call
    // const response = await fetch('/api/user/account', {
    //   method: 'DELETE',
    // });
    
    // if (!response.ok) {
    //   throw new Error('Failed to delete account');
    // }

    // Symulacja API call na potrzeby dewelopmentu
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Wyświetl powiadomienie sukcesu
    toast.success('Konto zostało usunięte', 'Zostaniesz wylogowany');
    
    isDialogOpen.value = false;

    // TODO: Wylogowanie użytkownika i przekierowanie na stronę główną
    // await logout();
    // window.location.href = '/';

  } catch (error) {
    console.error('Błąd podczas usuwania konta:', error);
    toast.error('Błąd usuwania konta', 'Wystąpił błąd podczas usuwania konta. Spróbuj ponownie.');
  } finally {
    isDeleting.value = false;
  }
};
</script>

<template>
  <div class="account-delete-section">
    <p class="text-sm text-muted-foreground mb-4">
      Po usunięciu konta wszystkie Twoje dane, w tym cele, aktywności i historia zmian,
      zostaną trwale usunięte. Ta operacja jest nieodwracalna.
    </p>

    <!-- Dialog (modal) z potwierdzeniem -->
    <Dialog v-model:open="isDialogOpen">
      <!-- Przycisk otwierający modal -->
      <DialogTrigger as-child>
        <Button variant="destructive">
          Usuń konto
        </Button>
      </DialogTrigger>

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

