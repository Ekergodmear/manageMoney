import type { PersistedAppState } from '@/features/session/session-types';
import { EMPTY_PERSISTED_STATE } from '@/features/session/session-types';
import type { EventBus } from '@/services/events/domain-events';
import { AppStateRepository } from '@/services/storage/repositories/app-state-repository';
import type { StorageDriver } from '@/services/storage/StorageDriver';

export class PersistenceService {
  private readonly repository: AppStateRepository;

  constructor(
    driver: StorageDriver,
    private readonly events?: EventBus,
  ) {
    this.repository = new AppStateRepository(driver);
  }

  async load(): Promise<PersistedAppState> {
    try {
      const { state, migratedFrom } = await this.repository.loadWithMeta();
      this.events?.emit(this.events.createEvent('StorageOpened', {}));
      if (migratedFrom !== null) {
        this.events?.emit(
          this.events.createEvent('MigrationCompleted', {
            fromVersion: migratedFrom,
            toVersion: state.version,
          }),
        );
      }
      return state;
    } catch (error) {
      this.events?.emit(
        this.events.createEvent('StorageFailed', {
          reason: error instanceof Error ? error.message : 'storage load failed',
        }),
      );
      return EMPTY_PERSISTED_STATE;
    }
  }

  async save(state: PersistedAppState): Promise<void> {
    try {
      await this.repository.save(state);
      this.events?.emit(this.events.createEvent('StorageSaved', {}));
    } catch (error: unknown) {
      this.events?.emit(
        this.events.createEvent('StorageFailed', {
          reason: error instanceof Error ? error.message : 'storage save failed',
        }),
      );
    }
  }
}
