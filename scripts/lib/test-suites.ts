/** fast-check / property-based suites (nightly profile). */
export const PROPERTY_TEST_PATHS = ['tests/property'] as const;

/** Batched unit runs — each batch spawns a fresh Node process via scripts/run-vitest.mjs. */
export const UNIT_TEST_BATCHES = [
  ['tests/unit/validation', 'tests/unit/dto', 'tests/unit/contracts'],
  ['tests/unit/services'],
  ['tests/unit/solver', 'tests/unit/optimization'],
  ['tests/unit/simulation', 'tests/unit/statistics-builder', 'tests/unit/strategy-builder'],
  ['tests/unit/insights', 'tests/unit/experiment'],
  ['tests/unit/planning'],
  ['tests/unit/improve'],
  ['tests/unit/continue'],
] as const;

/** Core unit — use batches in verify; single path for pnpm test:unit. */
export const UNIT_TEST_PATHS = ['tests/unit'] as const;

export const UNIT_TEST_EXCLUDES = [
  'tests/unit/game-data/**',
  'tests/unit/notifications/**',
] as const;

export const ARCHITECTURE_TEST_PATHS = ['tests/architecture'] as const;

/** Domain + consumer integration. */
export const INTEGRATION_TEST_PATHS = [
  'tests/unit/game-data',
  'tests/unit/notifications',
  'tests/integration/capital',
  'tests/consumer',
  'tests/examples',
] as const;

export const SMOKE_TEST_PATHS = [
  'tests/unit/planning/session-rollout-smoke.spec.ts',
  'tests/unit/game-data/statistics.test.ts',
  'tests/compat/public-api-snapshot.test.ts',
] as const;

/** RC verify gates — must PASS for Internal RC commit. */
export const RC_GATE_STEP_IDS = [
  'typecheck',
  'lint',
  'unit',
  'architecture',
  'gameData',
  'notifications',
  'build',
  'smoke',
] as const;

/** Nightly-only — failure does not block RC verdict. */
export const NIGHTLY_STEP_IDS = ['property', 'soak', 'performance'] as const;

export type VerifyProfile = 'rc' | 'nightly';
