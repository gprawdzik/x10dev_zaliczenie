import { defineConfig } from 'astro/config'
import vue from '@astrojs/vue'
// import tailwind from '@astrojs/tailwind'
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from '@tailwindcss/vite'

// https://astro.build/config
export default defineConfig({
  // Adapter Node.js - wymagany dla server-rendered endpoints
  adapter: cloudflare({
    mode: 'standalone',
  }),
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
    },
  },
  // Konfiguracja output - 'server' dla SSR i API endpoints
  // Strony mogą być oznaczone jako 'prerender = true' dla static generation
  output: 'server',
})
