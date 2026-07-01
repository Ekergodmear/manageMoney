import type { LibraryCollection } from '@/features/library/library-types';
import type { PersistedAppState } from '@/features/session/session-types';
import type { PersistenceService } from '@/services/storage/PersistenceService';

export class LibraryRepository {
  constructor(private readonly storage: PersistenceService) {}

  async loadState(): Promise<PersistedAppState> {
    return this.storage.load();
  }

  async saveState(state: PersistedAppState): Promise<void> {
    return this.storage.save(state);
  }

  async addCollection(collection: LibraryCollection): Promise<PersistedAppState> {
    const state = await this.loadState();
    const next: PersistedAppState = {
      ...state,
      libraryCollections: [...state.libraryCollections, collection],
    };
    await this.saveState(next);
    return next;
  }
}
