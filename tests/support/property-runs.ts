/**
 * Property test run counts — profile via PROPERTY_RUNS or PROPERTY_PROFILE.
 *
 * RC (default):     300   — pnpm verify, pre-commit
 * Nightly:        5 000  — pnpm verify:nightly, pnpm test:property
 * Stress (local): 50 000 — pnpm test:property:stress
 */

const RUNS_BY_PROFILE: Readonly<Record<string, number>> = {
  rc: 300,
  ci: 300,
  nightly: 5_000,
  stress: 50_000,
};

export function getPropertyRuns(): number {
  const explicit = process.env.PROPERTY_RUNS;
  if (explicit !== undefined && explicit !== '') {
    const parsed = Number(explicit);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.floor(parsed);
    }
  }

  const profile = process.env.PROPERTY_PROFILE ?? 'rc';
  return RUNS_BY_PROFILE[profile] ?? RUNS_BY_PROFILE.rc ?? 300;
}

/** Determinism checks — capped relative to property profile. */
export function getDeterminismRuns(): number {
  return Math.min(1_000, Math.max(50, getPropertyRuns() * 2));
}

/** Differential fast-check suites — lighter than full property profile. */
export function getDifferentialRuns(): number {
  return Math.min(150, getPropertyRuns());
}
