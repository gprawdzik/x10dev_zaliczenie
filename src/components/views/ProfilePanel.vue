<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PasswordChangeForm from './PasswordChangeForm.vue';
import AccountDeleteSection from './AccountDeleteSection.vue';
</script>

<template>
  <div class="profile-panel grid w-full gap-6 lg:grid-cols-2 lg:items-start">
    <!-- Karta zmiany hasła -->
    <Card>
      <CardHeader>
        <CardTitle>Zmiana hasła</CardTitle>
        <CardDescription>
          Zaktualizuj swoje hasło. Nowe hasło musi mieć co najmniej 10 znaków.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PasswordChangeForm />
      </CardContent>
    </Card>

    <!-- Karta usuwania konta -->
    <Card>
      <CardHeader>
        <CardTitle>Usunięcie konta</CardTitle>
        <CardDescription>
          Ta operacja jest nieodwracalna. Wszystkie Twoje dane zostaną trwale usunięte.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AccountDeleteSection />
      </CardContent>
    </Card>
  </div>
</template>

<style scoped>
.profile-panel {
  width: 100%;
}
</style>

