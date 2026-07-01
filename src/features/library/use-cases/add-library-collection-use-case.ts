import type { LibraryCollection } from '@/features/library/library-types';
import type { PersistedAppState } from '@/features/session/session-types';
import type { LibraryRepository } from '@/services/storage/repositories/library-repository';

export interface AddLibraryCollectionUseCaseDeps {
  readonly library: LibraryRepository;
}

export type AddLibraryCollectionSuccess = {
  readonly ok: true;
  readonly collection: LibraryCollection;
  readonly nextState: PersistedAppState;
};

export class AddLibraryCollectionUseCase {
  constructor(private readonly deps: AddLibraryCollectionUseCaseDeps) {}

  async execute(collection: LibraryCollection): Promise<AddLibraryCollectionSuccess> {
    const nextState = await this.deps.library.addCollection(collection);
    return { ok: true, collection, nextState };
  }
}

export function createAddLibraryCollectionUseCase(
  deps: AddLibraryCollectionUseCaseDeps,
): AddLibraryCollectionUseCase {
  return new AddLibraryCollectionUseCase(deps);
}
