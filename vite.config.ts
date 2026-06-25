import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

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
      '@game': fromRoot('src/game'),
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
    // Babylon's engine is loaded on demand (see Game.ensureEngine) and isolated
    // into its own long-lived chunk: large, but fetched only when a run starts
    // and cached across sessions. We lift the warning threshold accordingly
    // rather than fragment it into many small requests.
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
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: false,
  },
});
