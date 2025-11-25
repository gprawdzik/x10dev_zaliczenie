import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// In CI environment, use secrets from GitHub Actions
// Locally, load from .env.test file
if (!process.env.CI) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',

  /* Global teardown - cleanup test data after all tests */
  globalTeardown: './tests/global.teardown.ts',

  timeout: 6000, // timeout
  expect: {
    timeout: 5000, // timeout dla expect()
  },

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://localhost:4321',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video recording on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers - Only Chromium as per guidelines */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use browser contexts for isolating test environments
        contextOptions: {
          // Isolate each test in its own context
          viewport: { width: 1280, height: 720 },
        }
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev:e2e',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    // Pass environment variables to the Astro dev server process
    // This ensures variables are available in CI without needing a .env.test file
    // In local dev, the dotenv.config() above loads .env.test first
    env: {
      PUBLIC_SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL || '',
      PUBLIC_SUPABASE_KEY: process.env.PUBLIC_SUPABASE_KEY || '',
      E2E_USERNAME: process.env.E2E_USERNAME || '',
      E2E_PASSWORD: process.env.E2E_PASSWORD || '',
      E2E_USERNAME_ID: process.env.E2E_USERNAME_ID || '',
      ENV: process.env.ENV || 'test',
    },
  },
});

