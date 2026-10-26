import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: process.env.TEST_BASE_URL ?? "http://127.0.0.1:4175",
    headless: true,
    serviceWorkers: "block",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    {
      name: "phone",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: process.env.TEST_BASE_URL
    ? undefined
    : {
        command: "pnpm preview --port 4175",
        url: "http://127.0.0.1:4175",
        reuseExistingServer: !process.env.CI,
      },
});
