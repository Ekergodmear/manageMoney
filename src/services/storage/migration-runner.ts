import type { PersistedAppState } from '@/features/session/session-types';

import { migratePersistedState } from '@/services/storage/migrate-persisted-state';

export const PERSISTED_STATE_VERSION = 6 as const;

export interface PersistedStateMigrationResult {
  readonly state: PersistedAppState;
  readonly migratedFrom: number | null;
}

function readSourceVersion(raw: unknown): number | null {
  if (raw === null || typeof raw !== 'object' || !('version' in raw)) {
    return null;
  }
  const version = Number((raw as { version?: unknown }).version);
  return Number.isFinite(version) ? version : null;
}

/** Run forward-only migration and report the source schema version when it changed. */
export function runPersistedStateMigration(raw: unknown): PersistedStateMigrationResult {
  const beforeVersion = readSourceVersion(raw);
  const state = migratePersistedState(raw);
  const migratedFrom =
    beforeVersion !== null && beforeVersion !== state.version ? beforeVersion : null;
  return { state, migratedFrom };
}

/** Idempotent migration — safe to call on already-migrated state. */
export function migratePersistedStateIdempotent(raw: unknown): PersistedAppState {
  const first = migratePersistedState(raw);
  const second = migratePersistedState(first);
  return second;
}
