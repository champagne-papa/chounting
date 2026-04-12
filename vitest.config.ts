import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup/loadEnv.ts'],
    globalSetup: './tests/setup/globalSetup.ts',
    testTimeout: 15000,
    hookTimeout: 15000,
    fileParallelism: false,
  },
});