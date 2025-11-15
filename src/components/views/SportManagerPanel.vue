<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { SportDto } from '@/types';
import { useToastStore } from '@/stores/toast';
import AddSportForm from './AddSportForm.vue';
import SportList from './SportList.vue';

// Lista sportów
const sports = ref<SportDto[]>([]);
// Stan ładowania
const isLoading = ref(false);
// Błąd ładowania
const error = ref<string | null>(null);

// Toast store do wyświetlania powiadomień
const toast = useToastStore();

/**
 * Pobiera listę sportów z API
 */
const fetchSports = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    // TODO: Implementacja prawdziwego API call
    const response = await fetch('/api/sports');
    
    if (!response.ok) {
      throw new Error('Failed to fetch sports');
    }
    
    const data = await response.json();
    sports.value = data;

  } catch (err) {
    console.error('Błąd podczas pobierania sportów:', err);
    error.value = 'Nie udało się pobrać listy sportów';
    toast.error('Błąd pobierania sportów', 'Nie udało się pobrać listy sportów');
  } finally {
    isLoading.value = false;
  }
};

/**
 * Obsługa wydarzenia dodania nowego sportu
 * Odświeża listę sportów
 */
const handleSportCreated = () => {
  fetchSports();
};

// Pobierz sporty przy montowaniu komponentu
onMounted(() => {
  fetchSports();
});
</script>

<template>
  <div class="sport-manager-panel space-y-6">
    <!-- Karta dodawania sportu -->
    <Card>
      <CardHeader>
        <CardTitle>Dodaj nowy sport</CardTitle>
        <CardDescription>
          Utwórz nową dyscyplinę sportową w systemie
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AddSportForm @sport-created="handleSportCreated" />
      </CardContent>
    </Card>

    <!-- Karta listy sportów -->
    <Card>
      <CardHeader>
        <CardTitle>Lista sportów</CardTitle>
        <CardDescription>
          Wszystkie dostępne dyscypliny sportowe w systemie
        </CardDescription>
      </CardHeader>
      <CardContent>
        <!-- Stan ładowania -->
        <div v-if="isLoading" class="text-sm text-muted-foreground">
          Ładowanie sportów...
        </div>

        <!-- Błąd -->
        <div v-else-if="error" class="text-sm text-red-500">
          {{ error }}
        </div>

        <!-- Lista sportów -->
        <SportList v-else :sports="sports" />
      </CardContent>
    </Card>
  </div>
</template>

<style scoped>
.sport-manager-panel {
  max-width: 1000px;
}
</style>

