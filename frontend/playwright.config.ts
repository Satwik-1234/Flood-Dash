import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 * 
 * NOTE: To protect local (<150MB) disk space requirements, this file is 
 * formulated solely for HEADLESS EXECUTION ON GITHUB ACTIONS.
 * 
 * Local usage (`npx playwright test`) requires downloading massive ~800MB WebKit
 * binaries which violate the strict environment storage capabilities defined by the project owner.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
