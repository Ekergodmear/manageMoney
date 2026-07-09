import type { Clock } from '@/services/clock/clock';
import type { EventBus } from '@/services/events/domain-events';
import type { SystemEvent } from '@/services/events/event-types';
import {
  classifyStorageErrorMessage,
  type StorageErrorCause,
} from '@/services/storage/storage-errors';

export type PersistenceOperationalStatus = 'healthy' | 'degraded' | 'offline' | 'critical';

export interface LastMigrationView {
  readonly status: 'success' | 'failed';
  readonly at: string;
  readonly fromVersion: number | null;
  readonly toVersion: number | null;
  readonly cause: StorageErrorCause | null;
}

export interface LastErrorView {
  readonly cause: StorageErrorCause;
  readonly message: string;
  readonly at: string;
}

export interface PersistenceHealthView {
  readonly status: PersistenceOperationalStatus;
  readonly lastLoadAt: string | null;
  readonly lastSaveAt: string | null;
  readonly lastMigration: LastMigrationView | null;
  readonly lastError: LastErrorView | null;
}

const EMPTY_VIEW: PersistenceHealthView = {
  status: 'healthy',
  lastLoadAt: null,
  lastSaveAt: null,
  lastMigration: null,
  lastError: null,
};

function toIso(clock: Clock): string {
  return clock.now().toISOString();
}

function isLoadFailure(cause: StorageErrorCause): boolean {
  return (
    cause === 'storage_open_failed' ||
    cause === 'migration_failed' ||
    cause === 'indexeddb_unavailable'
  );
}

export class PersistenceHealthMonitor {
  private view: PersistenceHealthView = EMPTY_VIEW;
  private readonly unsubscribes: (() => void)[] = [];

  constructor(
    private readonly bus: EventBus,
    private readonly clock: Clock,
  ) {
    const types = ['StorageOpened', 'StorageSaved', 'StorageFailed', 'MigrationCompleted'] as const;
    for (const type of types) {
      this.unsubscribes.push(
        this.bus.subscribe(type, (event) => {
          this.handleEvent(event);
        }),
      );
    }
  }

  getView(): PersistenceHealthView {
    return this.view;
  }

  setOffline(at: string = toIso(this.clock)): void {
    this.view = {
      ...this.view,
      status: 'offline',
      lastError: {
        cause: 'indexeddb_unavailable',
        message: 'IndexedDB unavailable',
        at,
      },
    };
  }

  dispose(): void {
    for (const unsub of this.unsubscribes) {
      unsub();
    }
    this.unsubscribes.length = 0;
  }

  private handleEvent(event: SystemEvent): void {
    const at = event.occurredAt.toISOString();
    switch (event.type) {
      case 'StorageOpened':
        this.view = {
          ...this.view,
          lastLoadAt: at,
          status: this.view.status === 'offline' ? 'offline' : 'healthy',
        };
        break;
      case 'StorageSaved':
        this.view = {
          ...this.view,
          lastSaveAt: at,
          status:
            this.view.status === 'critical' || this.view.status === 'offline'
              ? this.view.status
              : 'healthy',
        };
        break;
      case 'MigrationCompleted':
        this.view = {
          ...this.view,
          lastMigration: {
            status: 'success',
            at,
            fromVersion: event.fromVersion,
            toVersion: event.toVersion,
            cause: null,
          },
          status: this.view.status === 'offline' ? 'offline' : 'healthy',
        };
        break;
      case 'StorageFailed': {
        const cause = classifyStorageErrorMessage(event.reason);
        const migrationFailed = cause === 'migration_failed';
        const critical = migrationFailed || isLoadFailure(cause);
        this.view = {
          ...this.view,
          status: critical ? 'critical' : cause === 'indexeddb_unavailable' ? 'offline' : 'degraded',
          lastError: {
            cause,
            message: event.reason,
            at,
          },
          lastMigration: migrationFailed
            ? {
                status: 'failed',
                at,
                fromVersion: this.view.lastMigration?.fromVersion ?? null,
                toVersion: this.view.lastMigration?.toVersion ?? null,
                cause,
              }
            : this.view.lastMigration,
        };
        break;
      }
      default:
        break;
    }
  }
}
