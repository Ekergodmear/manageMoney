import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const pkg = JSON.parse(readFileSync(join(import.meta.dirname, 'package.json'), 'utf8')) as {
  version: string;
};

function resolveBuildInfo(): { buildVersion: string; commitHash: string; buildDate: string } {
  return {
    buildVersion: pkg.version,
    commitHash: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.VITE_COMMIT_HASH ?? 'local',
    buildDate: new Date().toISOString().slice(0, 10),
  };
}

/**
 * Path aliases: defined once in tsconfig.json `compilerOptions.paths`.
 * vite-tsconfig-paths applies them here — do not duplicate resolve.alias manually.
 */
export default defineConfig({
  plugins: [tailwindcss(), tsconfigPaths(), react()],
  define: {
    __APP_BUILD_INFO__: JSON.stringify(resolveBuildInfo()),
  },
  build: {
    outDir: 'dist-app',
  },
});
