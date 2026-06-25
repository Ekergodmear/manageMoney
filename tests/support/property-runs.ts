/**
 * Property test run counts — profile via PROPERTY_RUNS or PROPERTY_PROFILE.
 *
 * CI (default):     2 000
 * Nightly:         10 000  — pnpm test:property
 * Stress (local):  50 000  — pnpm test:property:stress
 */

const RUNS_BY_PROFILE: Readonly<Record<string, number>> = {
  ci: 2_000,
  nightly: 10_000,
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

  const profile = process.env.PROPERTY_PROFILE ?? 'ci';
  return RUNS_BY_PROFILE[profile] ?? RUNS_BY_PROFILE.ci ?? 2_000;
}
