<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ui/ThemeToggle.vue';

// Stan mobilnego menu
const isMobileMenuOpen = ref(false);

// Aktualna ścieżka (do podświetlania aktywnego linku)
// Używamy pustego stringa jako wartość początkową dla SSR
const currentPath = ref('');

// Po montowaniu komponentu pobierz aktualną ścieżkę
onMounted(() => {
  currentPath.value = window.location.pathname;
});

// Nawigacja - linki
const navLinks = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/goals', label: 'Cele', icon: '🎯' },
  { href: '/activities', label: 'Aktywności', icon: '🏃' },
  { href: '/progress', label: 'Postępy', icon: '📈' },
  { href: '/settings', label: 'Ustawienia', icon: '⚙️' },
];

/**
 * Sprawdza czy link jest aktywny
 */
const isActive = (href: string) => {
  if (href === '/') {
    return currentPath.value === '/';
  }
  return currentPath.value.startsWith(href);
};

/**
 * Przełącza mobilne menu
 */
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};
</script>

<template>
  <nav class="navbar">
    <div class="navbar-container">
      <!-- Logo i nazwa aplikacji -->
      <a href="/" class="navbar-brand">
        <span class="brand-icon">🏃‍♂️</span>
        <span class="brand-name">StravaGoals</span>
      </a>

      <!-- Nawigacja desktop -->
      <div class="navbar-links">
        <a
          v-for="link in navLinks"
          :key="link.href"
          :href="link.href"
          :class="['nav-link', { active: isActive(link.href) }]"
        >
          <span class="nav-icon">{{ link.icon }}</span>
          <span>{{ link.label }}</span>
        </a>
      </div>

      <!-- Przycisk user menu (placeholder na przyszłość) -->
      <div class="navbar-actions">
        <ThemeToggle />
        <Button variant="ghost" size="sm" class="hidden md:flex">
          <span class="text-sm">👤 Użytkownik</span>
        </Button>

        <!-- Przycisk mobile menu -->
        <button
          class="mobile-menu-button md:hidden"
          @click="toggleMobileMenu"
          aria-label="Toggle menu"
        >
          <span v-if="!isMobileMenuOpen">☰</span>
          <span v-else>✕</span>
        </button>
      </div>
    </div>

    <!-- Mobilne menu -->
    <div v-if="isMobileMenuOpen" class="mobile-menu md:hidden">
      <a
        v-for="link in navLinks"
        :key="link.href"
        :href="link.href"
        :class="['mobile-nav-link', { active: isActive(link.href) }]"
        @click="isMobileMenuOpen = false"
      >
        <span class="nav-icon">{{ link.icon }}</span>
        <span>{{ link.label }}</span>
      </a>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 50;
  width: 100%;
  border-bottom: 1px solid hsl(var(--border));
  background-color: hsl(var(--background) / 0.95);
  backdrop-filter: blur(8px);
}

.navbar-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0.75rem 1rem;
  gap: 1rem;
}

/* Logo */
.navbar-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: hsl(var(--foreground));
  text-decoration: none;
  transition: opacity 0.2s;
}

.navbar-brand:hover {
  opacity: 0.8;
}

.brand-icon {
  font-size: 1.5rem;
}

.brand-name {
  display: none;
}

@media (min-width: 640px) {
  .brand-name {
    display: inline;
  }
}

/* Desktop navigation */
.navbar-links {
  display: none;
  gap: 0.25rem;
}

@media (min-width: 768px) {
  .navbar-links {
    display: flex;
    flex: 1;
    justify-content: center;
  }
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
  text-decoration: none;
  transition: all 0.2s;
}

.nav-link:hover {
  background-color: hsl(var(--accent));
  color: hsl(var(--accent-foreground));
}

.nav-link.active {
  background-color: hsl(var(--accent));
  color: hsl(var(--accent-foreground));
  font-weight: 600;
}

.nav-icon {
  font-size: 1.125rem;
}

/* Actions */
.navbar-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Mobile menu button */
.mobile-menu-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  font-size: 1.5rem;
  background: transparent;
  border: none;
  color: hsl(var(--foreground));
  cursor: pointer;
  transition: background-color 0.2s;
}

.mobile-menu-button:hover {
  background-color: hsl(var(--accent));
}

@media (min-width: 768px) {
  .mobile-menu-button {
    display: none;
  }
}

/* Mobile menu */
.mobile-menu {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem 1rem 1rem;
  border-top: 1px solid hsl(var(--border));
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  color: hsl(var(--foreground));
  text-decoration: none;
  transition: all 0.2s;
}

.mobile-nav-link:hover {
  background-color: hsl(var(--accent));
}

.mobile-nav-link.active {
  background-color: hsl(var(--accent));
  font-weight: 600;
}

@media (min-width: 768px) {
  .mobile-menu {
    display: none;
  }
}
</style>

