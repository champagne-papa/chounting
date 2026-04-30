// playwright.config.ts
// Playwright harness for project-side e2e specs. Introduced by
// Session 7.1.2 to land EC-19 (canvas-context over-anchoring test)
// as its first spec. Chromium-only for Phase 1.2; additional
// browsers / persona fixtures added as future specs require.

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  globalSetup: './tests/e2e/fixtures/auth.ts',
  use: {
    baseURL: 'http://localhost:3000',
    storageState: 'tests/e2e/.auth/user.json',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
