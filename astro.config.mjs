import { defineConfig } from 'astro/config'
import vue from '@astrojs/vue'
// import tailwind from '@astrojs/tailwind'
import cloudflare from '@astrojs/cloudflare'
import tailwindcss from '@tailwindcss/vite'

// https://astro.build/config
export default defineConfig({
  // Adapter Node.js - wymagany dla server-rendered endpoints
  adapter: cloudflare(),
  integrations: [
    // Vue integration - pozwala używać komponentów Vue jako islands
    vue({
      // Opcjonalnie: konfiguracja dla komponentów Vue
      appEntrypoint: '/src/plugins/vue-app',
    }),
    // Tailwind integration - automatyczna konfiguracja Tailwind CSS
    // tailwind({
    // Tailwind 4.x używa natywnego CSS
    // applyBaseStyles: false,
    // }),
  ],
  // Aliasy dla łatwiejszych importów
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': '/src',
      },
      // Naprawia problemy z importami bez rozszerzeń w @supabase/ssr
      extensions: ['.js', '.ts', '.jsx', '.tsx', '.json'],
    },
    optimizeDeps: {
      include: ['@supabase/ssr'],
    },
    ssr: {
      noExternal: ['@supabase/ssr'],
    },
  },
  // Konfiguracja output - 'server' dla SSR i API endpoints
  // Strony mogą być oznaczone jako 'prerender = true' dla static generation
  output: 'server',
})
