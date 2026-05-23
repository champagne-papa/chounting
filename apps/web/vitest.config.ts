import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Use the automatic JSX runtime so component test files (and the Next.js
  // components they import, which do not import React) transform correctly.
  // No effect on the existing .ts node tests (no JSX).
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'node',
    // Component tests under tests/unit/components/*.test.tsx opt into jsdom
    // per-file via a `// @vitest-environment jsdom` directive; the global
    // environment stays 'node' so the existing suite is untouched.
    include: ['tests/**/*.test.{ts,tsx}', '../../eslint-rules/__tests__/**/*.test.{js,ts}'],
    setupFiles: ['tests/setup/loadEnv.ts'],
    globalSetup: './tests/setup/globalSetup.ts',
    testTimeout: 15000,
    hookTimeout: 15000,
    fileParallelism: false,
  },
});