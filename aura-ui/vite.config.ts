import { configDefaults, defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import plugin from '@vitejs/plugin-react';

import tsconfigPaths from "vite-tsconfig-paths";

/** Lets an isolated UI worktree proxy to its own API without disturbing another local run. */
const apiProxyTarget = process.env.AURA_API_PROXY_TARGET ?? "http://127.0.0.1:5082";
// The root launcher supplies this private loopback proxy only for local development.
const devControlTarget = process.env.AURA_DEV_CONTROL_TARGET;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  // Production and dedicated FIT bundles require the Pages proxy's same-origin API base.
  if (["production", "fit"].includes(mode) && !env.VITE_API_BASE_URL?.trim()) {
    throw new Error("VITE_API_BASE_URL is required for Production and FIT builds. Set it to the deployed API base URL (for example, /api).");
  }

  return {
    // Concurrent local preview and browser checks must not replace each other's optimized imports.
    cacheDir: process.env.VITE_CACHE_DIR ?? "node_modules/.vite",
    plugins: [plugin(), tsconfigPaths()],
    server: {
      port: 58407,
      // Fixed port: PasswordReset:ResetUrlBase in appsettings.Development.json points here (#335).
      strictPort: true,
      // Route phone-preview API requests through the laptop while the API remains on loopback.
      proxy: {
        "/api": { target: apiProxyTarget, changeOrigin: true },
        ...(devControlTarget ? { "/__aura_dev": { target: devControlTarget, changeOrigin: true } } : {}),
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      globals: true,
      // Playwright owns e2e/ browser specs; keep them out of the jsdom unit run.
      exclude: [...configDefaults.exclude, "e2e/**"],
      // RTK Query builds absolute URLs from this; without it Node fetch rejects "undefined/Auth/...".
      // CI has no .env file, so unit tests get a fixed placeholder origin (requests are mocked).
      env: { VITE_API_BASE_URL: "http://localhost/api" },
    },
  };
});
