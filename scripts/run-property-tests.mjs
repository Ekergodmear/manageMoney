/**
 * Cross-platform runner for solver property tests with profile-specific run counts.
 * Usage: node scripts/run-property-tests.mjs [ci|nightly|stress]
 */

import { spawnSync } from 'node:child_process';

const profile = process.argv[2] ?? 'ci';
process.env.PROPERTY_PROFILE = profile;

const result = spawnSync(
  process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
  ['exec', 'vitest', 'run', 'tests/unit/solver/solver.properties.test.ts'],
  { stdio: 'inherit', env: process.env, shell: true },
);

process.exit(result.status ?? 1);
