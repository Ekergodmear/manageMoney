/** Operator-facing persistence failure taxonomy — not stack traces. */
export type StorageErrorCause =
  | 'storage_open_failed'
  | 'migration_failed'
  | 'persistence_failed'
  | 'quota_exceeded'
  | 'indexeddb_unavailable'
  | 'unknown';

const CAUSE_LABELS: Record<StorageErrorCause, string> = {
  storage_open_failed: 'Storage Open Failed',
  migration_failed: 'Migration Failed',
  persistence_failed: 'Persistence Failed',
  quota_exceeded: 'Quota Exceeded',
  indexeddb_unavailable: 'IndexedDB Unavailable',
  unknown: 'Unknown',
};

export function formatStorageErrorCause(cause: StorageErrorCause): string {
  return CAUSE_LABELS[cause];
}

export function classifyStorageErrorMessage(reason: string): StorageErrorCause {
  const lower = reason.toLowerCase();
  if (lower.includes('quota') || lower.includes('quotaexceeded')) {
    return 'quota_exceeded';
  }
  if (lower.includes('migration')) {
    return 'migration_failed';
  }
  if (lower.includes('indexeddb') || lower.includes('idb')) {
    if (lower.includes('open') || lower.includes('unavailable')) {
      return lower.includes('open') ? 'storage_open_failed' : 'indexeddb_unavailable';
    }
    return 'indexeddb_unavailable';
  }
  if (lower.includes('open failed') || lower.includes('storage open')) {
    return 'storage_open_failed';
  }
  if (lower.includes('save') || lower.includes('put') || lower.includes('persist')) {
    return 'persistence_failed';
  }
  return 'unknown';
}

export function classifyStorageError(error: unknown): StorageErrorCause {
  if (error instanceof Error) {
    return classifyStorageErrorMessage(error.message);
  }
  if (typeof error === 'string') {
    return classifyStorageErrorMessage(error);
  }
  return 'unknown';
}
