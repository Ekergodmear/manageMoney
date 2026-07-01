import type { PersistedAppState } from '@/features/session/session-types';
import { PERSISTED_STATE_VERSION } from '@/services/storage/migration-runner';
import { probeIndexedDbAvailability } from '@/services/storage/diagnostics/probe-indexeddb';
import { readPersistedStateForDiagnostics } from '@/services/storage/diagnostics/read-persisted-state';
import type {
  PersistenceHealthView,
  PersistenceOperationalStatus,
} from '@/services/storage/persistence-health';
import { IndexedDbDriver } from '@/services/storage/IndexedDbDriver';
import { MemoryStorageDriver } from '@/services/storage/MemoryStorageDriver';
import type { StorageDriver } from '@/services/storage/StorageDriver';
import { formatStorageErrorCause } from '@/services/storage/storage-errors';

export interface PersistenceRepositoryCounts {
  readonly sessions: number;
  readonly drafts: number;
  readonly candidates: number;
  readonly libraryCollections: number;
  readonly notifications: number;
}

export interface PersistenceSnapshot {
  readonly status: PersistenceOperationalStatus;
  readonly driverLabel: string;
  readonly schemaVersion: number;
  readonly lastMigration: PersistenceHealthView['lastMigration'];
  readonly lastSaveAt: string | null;
  readonly lastLoadAt: string | null;
  readonly lastError: PersistenceHealthView['lastError'];
  readonly counts: PersistenceRepositoryCounts;
  readonly storageSizeEstimate: string | null;
  readonly checkedAt: string;
}

export interface BuildPersistenceSnapshotInput {
  readonly driver: StorageDriver;
  readonly health: PersistenceHealthView;
  readonly checkedAt?: string;
}

export function resolveStorageDriverLabel(driver: StorageDriver): string {
  if (driver instanceof IndexedDbDriver) {
    return 'IndexedDB';
  }
  if (driver instanceof MemoryStorageDriver) {
    return 'Memory';
  }
  return 'Unknown';
}

function countRepositories(state: PersistedAppState): PersistenceRepositoryCounts {
  return {
    sessions: state.sessions.length,
    drafts: state.planningDraft === null ? 0 : 1,
    candidates: state.planCandidate === null ? 0 : 1,
    libraryCollections: state.libraryCollections.length,
    notifications: state.notifications.length,
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${String(bytes)} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function estimateStorageSize(driver: StorageDriver): Promise<string | null> {
  if (typeof navigator !== 'undefined' && 'storage' in navigator && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      if (typeof estimate.usage === 'number') {
        return formatBytes(estimate.usage);
      }
    } catch {
      // fall through to payload estimate
    }
  }

  try {
    const state = await readPersistedStateForDiagnostics(driver);
    const payload = JSON.stringify(state);
    return `~${formatBytes(new TextEncoder().encode(payload).length)}`;
  } catch {
    return null;
  }
}

function deriveStatus(
  health: PersistenceHealthView,
  driver: StorageDriver,
  indexedDbAvailable: boolean,
): PersistenceOperationalStatus {
  if (driver instanceof IndexedDbDriver && !indexedDbAvailable) {
    return 'offline';
  }
  if (health.lastMigration?.status === 'failed') {
    return 'critical';
  }
  if (health.status === 'critical' || health.status === 'offline') {
    return health.status;
  }
  if (health.lastError !== null) {
    return health.status;
  }
  return 'healthy';
}

function formatMigration(lastMigration: PersistenceHealthView['lastMigration']): string {
  if (lastMigration === null) {
    return '—';
  }
  if (lastMigration.status === 'failed') {
    const cause =
      lastMigration.cause !== null ? formatStorageErrorCause(lastMigration.cause) : 'Failed';
    return `Failed (${cause})`;
  }
  if (lastMigration.fromVersion !== null && lastMigration.toVersion !== null) {
    return `Success (v${String(lastMigration.fromVersion)} → v${String(lastMigration.toVersion)})`;
  }
  return 'Success';
}

function formatTimestamp(iso: string | null): string {
  if (iso === null) {
    return '—';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString();
}

export async function buildPersistenceSnapshot(
  input: BuildPersistenceSnapshotInput,
): Promise<PersistenceSnapshot> {
  const checkedAt = input.checkedAt ?? new Date().toISOString();
  const indexedDbAvailable =
    input.driver instanceof IndexedDbDriver ? await probeIndexedDbAvailability() : true;
  const state = await readPersistedStateForDiagnostics(input.driver);
  const status = deriveStatus(input.health, input.driver, indexedDbAvailable);
  const storageSizeEstimate = await estimateStorageSize(input.driver);

  return {
    status,
    driverLabel: resolveStorageDriverLabel(input.driver),
    schemaVersion: state.version ?? PERSISTED_STATE_VERSION,
    lastMigration: input.health.lastMigration,
    lastSaveAt: input.health.lastSaveAt,
    lastLoadAt: input.health.lastLoadAt,
    lastError: input.health.lastError,
    counts: countRepositories(state),
    storageSizeEstimate,
    checkedAt,
  };
}

export function formatPersistenceSnapshotSummary(snapshot: PersistenceSnapshot): string {
  const statusLabel =
    snapshot.status === 'healthy'
      ? 'Healthy'
      : snapshot.status === 'degraded'
        ? 'Degraded'
        : snapshot.status === 'offline'
          ? 'Offline'
          : 'Critical';
  return `${String(snapshot.counts.sessions)} sessions · schema v${String(snapshot.schemaVersion)} · ${statusLabel}`;
}

export function formatMigrationForDisplay(
  lastMigration: PersistenceHealthView['lastMigration'],
): string {
  return formatMigration(lastMigration);
}

export function formatCheckedTimestamp(iso: string | null): string {
  return formatTimestamp(iso);
}
