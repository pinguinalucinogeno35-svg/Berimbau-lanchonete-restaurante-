import { defineConfig, devices } from '@playwright/test';

// Em ambientes com Chromium pré-instalado, aponte PLAYWRIGHT_CHROMIUM_PATH para o executável.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    locale: 'pt-BR',
    trace: 'retain-on-failure',
    launchOptions: { executablePath, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  projects: [
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 7'],
        launchOptions: { executablePath, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
      },
    },
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { executablePath, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
      },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 180_000,
    env: { VITE_DATA_SOURCE: 'demo' },
  },
});
