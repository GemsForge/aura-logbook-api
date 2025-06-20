import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';

import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [plugin(), tsconfigPaths()],
  server: {
    port: 58407,
  },
});
