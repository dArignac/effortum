import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3005",
    ignoreHTTPSErrors: true,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        // permissions: ["clipboard-read", "clipboard-write"], only needed for Chromium, which does not work under Ubuntu 25
      },
    },
  ],
  webServer: {
    command: "pnpm dev:alt",
    url: "http://localhost:3005",
    reuseExistingServer: false,
    timeout: 60 * 1000,
  },
});
