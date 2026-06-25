import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

/**
 * Path aliases: defined once in tsconfig.json `compilerOptions.paths`.
 * vite-tsconfig-paths applies them here — do not duplicate resolve.alias manually.
 */
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  build: {
    outDir: 'dist-app',
  },
});
