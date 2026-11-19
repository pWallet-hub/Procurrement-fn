import { defineConfig, devices } from '@playwright/test';

/**
 * Runs against a portal that is already up (npm run dev, docker compose, or a test server) with the dev seed accounts.
 *   E2E_BASE_URL   portal address           (default http://localhost:5173)
 *   E2E_PASSWORD   seed account password    (default Passw0rd!dev)
 * The tests create their own cases and drafts with unique names; never point them at production.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  // a few browsers at once: the portal is often a dev server on a laptop
  workers: process.env.E2E_WORKERS ? Number(process.env.E2E_WORKERS) : 3,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 860 } } },
    { name: 'phone', use: { ...devices['Pixel 5'] }, testMatch: /layout\.spec\.ts/ },
  ],
});
