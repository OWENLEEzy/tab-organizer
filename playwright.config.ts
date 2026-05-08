import { defineConfig, devices } from '@playwright/test';

const shouldManageWebServer = !process.env.PLAYWRIGHT_DISABLE_WEBSERVER;
const port = Number(process.env.PLAYWRIGHT_PORT ?? 4173);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  ...(shouldManageWebServer
    ? {
        webServer: {
          command: `NO_PROXY=127.0.0.1,localhost npx vite --config vite.a11y.config.ts --host 127.0.0.1 --port ${port} --strictPort`,
          url: `${baseURL}/`,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          env: { NO_PROXY: '127.0.0.1,localhost', no_proxy: '127.0.0.1,localhost' },
        },
      }
    : {}),
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
