<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

// Stan ładowania i modala
const isGenerating = ref(false);
const isDialogOpen = ref(false);

// Toast store do wyświetlania powiadomień
const toast = useToastStore();

/**
 * Obsługa generowania aktywności
 * Wysyła żądanie do API endpoint /api/activities/generate
 */
const handleGenerateActivities = async () => {
  isGenerating.value = true;

  try {
    // Wywołaj API do generowania aktywności
    const response = await fetch('/api/activities/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to generate activities');
    }
    
    const data = await response.json();
    
    // Wyświetl powiadomienie sukcesu z liczbą wygenerowanych aktywności
    const count = data.created_count || 0;
    toast.success(
      'Dane wygenerowane', 
      `Wygenerowano ${count} ${count === 1 ? 'aktywność' : 'aktywności'}`
    );
    
    isDialogOpen.value = false;

  } catch (error: any) {
    console.error('Błąd podczas generowania aktywności:', error);
    
    const errorMessage = error?.message || 'Wystąpił błąd podczas generowania danych. Spróbuj ponownie.';
    toast.error('Błąd generowania', errorMessage);
  } finally {
    isGenerating.value = false;
  }
};
</script>

<template>
  <div class="activity-generator-panel">
    <Card>
      <CardHeader>
        <CardTitle>Generator danych aktywności</CardTitle>
        <CardDescription>
          Wygeneruj symulowane dane aktywności do celów testowych i wizualizacji.
          Generator utworzy realistyczne dane treningowe dla bieżącego roku.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <p class="text-sm text-muted-foreground">
            Po uruchomieniu generatora zostaną utworzone przykładowe aktywności sportowe
            z różnymi parametrami (dystans, czas, wzniesienie). Proces może potrwać kilka sekund.
          </p>

          <!-- Dialog (modal) z potwierdzeniem -->
          <Dialog v-model:open="isDialogOpen">
            <!-- Przycisk otwierający modal -->
            <div class="flex justify-end pt-2">
              <DialogTrigger as-child>
                <Button :disabled="isGenerating">
                  Generuj dane
                </Button>
              </DialogTrigger>
            </div>

            <!-- Zawartość modala -->
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Potwierdzenie generowania danych</DialogTitle>
                <DialogDescription>
                  Czy na pewno chcesz wygenerować nowe dane aktywności?
                  Proces może zająć kilka sekund.
                </DialogDescription>
              </DialogHeader>

              <DialogFooter>
                <!-- Przycisk anuluj -->
                <DialogClose as-child>
                  <Button variant="outline" :disabled="isGenerating">
                    Anuluj
                  </Button>
                </DialogClose>

                <!-- Przycisk potwierdź -->
                <Button
                  :disabled="isGenerating"
                  @click="handleGenerateActivities"
                >
                  {{ isGenerating ? 'Generuję...' : 'Generuj' }}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <!-- Wskaźnik ładowania -->
          <div v-if="isGenerating" class="text-sm text-muted-foreground">
            Trwa generowanie danych aktywności...
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<style scoped>
.activity-generator-panel {
  max-width: 800px;
}
</style>

