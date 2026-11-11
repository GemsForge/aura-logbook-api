import { defineConfig } from "@playwright/test";

/** Runs real-browser Today layout checks on an isolated Vite port without requiring the API. */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:59783",
    browserName: "chromium",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 59783 --strictPort",
    url: "http://127.0.0.1:59783",
    reuseExistingServer: false,
    timeout: 30_000,
    env: { VITE_API_BASE_URL: "http://127.0.0.1:5082/api" },
  },
  outputDir: "./test-results/playwright",
});
