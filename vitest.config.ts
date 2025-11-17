import { fileURLToPath } from 'node:url'
import { defineConfig, configDefaults } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    // Configure jsdom for DOM testing
    environment: 'jsdom',
    
    // Exclude E2E tests
    exclude: [...configDefaults.exclude, 'tests/e2e/**', 'e2e/**'],
    
    root: fileURLToPath(new URL('./', import.meta.url)),
    
    // Enable globals for easier testing
    globals: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/dist/**',
        '**/*.config.*',
        '**/.*',
      ],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
