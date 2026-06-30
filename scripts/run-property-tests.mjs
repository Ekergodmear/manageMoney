/**
 * Cross-platform runner for property tests with profile-specific run counts.
 * Usage: node scripts/run-property-tests.mjs [rc|nightly|stress]
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const profile = process.argv[2] ?? 'rc';
process.env.PROPERTY_PROFILE = profile;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const vitest = join(ROOT, 'node_modules', 'vitest', 'vitest.mjs');

const result = spawnSync(process.execPath, [vitest, 'run', 'tests/property'], {
  stdio: 'inherit',
  env: process.env,
  cwd: ROOT,
});

process.exit(result.status ?? 1);
