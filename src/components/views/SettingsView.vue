<script setup lang="ts">
import { ref } from 'vue';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProfilePanel from './ProfilePanel.vue';
import ActivityGeneratorPanel from './ActivityGeneratorPanel.vue';
import SportManagerPanel from './SportManagerPanel.vue';

// Stan aktywnej zakładki
const activeTab = ref('profile');

// Tymczasowo ustawiamy na true dla celów deweloperskich
// W przyszłości będzie to pobierane z useUserStore
const isAdmin = ref(true);
</script>

<template>
  <div class="settings-view">
    <h1 class="text-3xl font-bold mb-6">Ustawienia</h1>
    
    <!-- Główny komponent zakładek -->
    <Tabs v-model="activeTab" class="w-full">
      <!-- Lista zakładek -->
      <TabsList class="grid w-full grid-cols-3">
        <TabsTrigger value="profile">
          Profil
        </TabsTrigger>
        <TabsTrigger value="generator">
          Generator danych
        </TabsTrigger>
        <!-- Zakładka Sporty widoczna tylko dla administratorów -->
        <TabsTrigger v-if="isAdmin" value="sports">
          Sporty
        </TabsTrigger>
      </TabsList>

      <!-- Zawartość zakładki Profil -->
      <TabsContent value="profile" class="mt-6">
        <ProfilePanel />
      </TabsContent>

      <!-- Zawartość zakładki Generator danych -->
      <TabsContent value="generator" class="mt-6">
        <ActivityGeneratorPanel />
      </TabsContent>

      <!-- Zawartość zakładki Sporty (tylko dla admina) -->
      <TabsContent v-if="isAdmin" value="sports" class="mt-6">
        <SportManagerPanel />
      </TabsContent>
    </Tabs>
  </div>
</template>

<style scoped>
.settings-view {
  width: 100%;
}
</style>

