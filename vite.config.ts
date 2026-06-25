import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const fromRoot = (segment: string): string => resolve(process.cwd(), segment);

/**
 * Vite configuration for PAXTA.
 *
 * - Path aliases are kept in sync with `tsconfig.app.json`.
 * - Telegram Mini Apps are served over HTTPS in production; during local
 *   development we expose the dev server on the network so it can be tunnelled.
 * - Babylon.js is split into its own chunk to keep the initial bundle lean.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fromRoot('src'),
      '@app': fromRoot('src/app'),
      '@core': fromRoot('src/core'),
      '@engine': fromRoot('src/engine'),
      '@systems': fromRoot('src/systems'),
      '@state': fromRoot('src/state'),
      '@telegram': fromRoot('src/telegram'),
      '@services': fromRoot('src/services'),
      '@ui': fromRoot('src/ui'),
      '@shared': fromRoot('src/shared'),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    // Babylon's engine is intentionally isolated into its own long-lived chunk;
    // it is large but cached across sessions and loaded once, so we lift the
    // warning threshold rather than fragment it into many small requests.
    chunkSizeWarningLimit: 6000,
    rollupOptions: {
      output: {
        manualChunks: {
          babylon: ['@babylonjs/core'],
          vendor: ['react', 'react-dom', 'zustand'],
        },
      },
    },
  },
});
