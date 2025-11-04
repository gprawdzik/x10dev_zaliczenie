import type { App } from 'vue';
import { createPinia } from 'pinia';
import { supabaseClient } from '../db/supabase.client.js';

// Ten plik konfiguruje Vue app dla komponentów Vue używanych w Astro
// Pozwala na użycie Pinia store oraz Supabase we wszystkich komponentach Vue
export default (app: App) => {
  const pinia = createPinia();
  app.use(pinia);

  // Dodaj Supabase jako globalną właściwość (opcjonalnie)
  // Komponenty mogą też importować supabaseClient bezpośrednio
  app.config.globalProperties.$supabase = supabaseClient;
};

