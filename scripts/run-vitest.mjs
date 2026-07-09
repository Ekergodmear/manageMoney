/**
 * Spawn vitest in a fresh Node process (avoids worker leaks when chained from tsx).
 * Usage: node scripts/run-vitest.mjs <paths...> [--exclude <glob> ...]
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const vitest = join(ROOT, 'node_modules', 'vitest', 'vitest.mjs');

const argv = process.argv.slice(2);
const paths = [];
const excludes = [];
for (let i = 0; i < argv.length; i += 1) {
  const arg = argv[i];
  if (arg === '--exclude') {
    const next = argv[i + 1];
    if (next !== undefined) {
      excludes.push(next);
      i += 1;
    }
    continue;
  }
  paths.push(arg);
}

const args = [
  vitest,
  'run',
  ...paths,
  '--reporter=dot',
  '--pool=forks',
  '--maxWorkers=1',
];
for (const pattern of excludes) {
  args.push('--exclude', pattern);
}

const result = spawnSync(process.execPath, args, {
  cwd: ROOT,
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
