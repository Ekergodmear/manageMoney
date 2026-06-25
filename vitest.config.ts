import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.js';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
      exclude: ['benchmarks/**', 'node_modules/**', 'dist/**'],
      retry: 0,
      coverage: {
        provider: 'v8',
        include: ['src/core/validation/**/*.ts'],
        exclude: ['src/core/validation/index.ts', 'src/core/validation/types.ts'],
        thresholds: {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
      },
    },
  }),
);
