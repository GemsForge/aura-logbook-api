import { defineConfig } from 'vitest/config';
import plugin from '@vitejs/plugin-react';

import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [plugin(), tsconfigPaths()],
  server: {
    port: 58407,
    // Route phone-preview API requests through the laptop while the API remains on loopback.
    proxy: {
      "/api": { target: "http://127.0.0.1:5082", changeOrigin: true },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true,
  },
});
