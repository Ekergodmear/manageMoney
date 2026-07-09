/**
 * Run unit test batches sequentially in a plain Node process (not tsx).
 * Pause between batches — rapid vitest restarts on Windows/OneDrive can hang.
 */

import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const runner = join(ROOT, 'scripts', 'run-vitest.mjs');

const batches = [
  ['tests/unit/validation', 'tests/unit/dto', 'tests/unit/contracts'],
  ['tests/unit/services'],
  ['tests/unit/solver', 'tests/unit/optimization'],
  ['tests/unit/simulation', 'tests/unit/statistics-builder', 'tests/unit/strategy-builder'],
  ['tests/unit/insights', 'tests/unit/experiment'],
  ['tests/unit/planning'],
  ['tests/unit/improve'],
  ['tests/unit/continue'],
];

function pauseMs(ms) {
  if (process.platform === 'win32') {
    spawnSync('powershell', ['-Command', `Start-Sleep -Milliseconds ${String(ms)}`], {
      stdio: 'ignore',
    });
    return;
  }
  spawnSync('sleep', [String(Math.ceil(ms / 1000))], { stdio: 'ignore' });
}

for (let i = 0; i < batches.length; i += 1) {
  if (i > 0) {
    pauseMs(2_000);
  }
  const batch = batches[i];
  const result = spawnSync(process.execPath, [runner, ...batch], {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

process.exit(0);
