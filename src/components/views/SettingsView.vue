<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabaseClient } from '@/db/supabase.client'
import ProfilePanel from './ProfilePanel.vue'
import ActivityGeneratorPanel from './ActivityGeneratorPanel.vue'
import SportManagerPanel from './SportManagerPanel.vue'

// Stan aktywnej zakładki
const activeTab = ref('profile')

const isAdmin = ref(false)
const isHydrated = ref(false)

const checkIsAdmin = (user: any) => {
  const metadata = (user?.app_metadata ?? {}) as Record<string, unknown>

  const role = metadata.role
  if (typeof role === 'string' && role.toLowerCase() === 'admin') {
    return true
  }

  const roles = metadata.roles
  if (Array.isArray(roles) && roles.some((entry) => typeof entry === 'string' && entry.toLowerCase() === 'admin')) {
    return true
  }

  if (metadata.is_admin === true) {
    return true
  }

  return false
}

onMounted(() => {
  supabaseClient.auth
    .getUser()
    .then(({ data }) => {
      isAdmin.value = checkIsAdmin(data.user)
    })
    .catch((error) => {
      console.error('Failed to fetch user for admin check', error)
      isAdmin.value = false
    })
    .finally(() => {
      isHydrated.value = true
    })
})
</script>

<template>
  <div class="settings-view" data-testid="settings-view" :data-hydrated="isHydrated">
    <h1 class="text-3xl font-bold mb-6">Ustawienia</h1>

    <!-- Główny komponent zakładek -->
    <Tabs v-model="activeTab" class="w-full">
      <!-- Lista zakładek -->
      <TabsList class="grid w-full grid-cols-3">
        <TabsTrigger value="profile" data-testid="settings-tab-profile"> Profil </TabsTrigger>
        <TabsTrigger value="generator" data-testid="settings-tab-generator">
          Generator danych
        </TabsTrigger>
        <!-- Zakładka Sporty widoczna tylko dla administratorów -->
        <TabsTrigger v-if="isAdmin" value="sports" data-testid="settings-tab-sports">
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
