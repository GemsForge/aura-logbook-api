import { configDefaults, defineConfig } from 'vitest/config';
import plugin from '@vitejs/plugin-react';

import tsconfigPaths from "vite-tsconfig-paths";

/** Lets an isolated UI worktree proxy to its own API without disturbing another local run. */
const apiProxyTarget = process.env.AURA_API_PROXY_TARGET ?? "http://127.0.0.1:5082";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [plugin(), tsconfigPaths()],
  server: {
    port: 58407,
    // Fixed port: PasswordReset:ResetUrlBase in appsettings.Development.json points here (#335).
    strictPort: true,
    // Route phone-preview API requests through the laptop while the API remains on loopback.
    proxy: {
      "/api": { target: apiProxyTarget, changeOrigin: true },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true,
    // Playwright owns e2e/ browser specs; keep them out of the jsdom unit run.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
