import type { PlanningDraft } from '@/features/planning/planning-types';
import type { PersistenceService } from '@/services/storage/PersistenceService';

export class PlanningDraftRepository {
  constructor(private readonly storage: PersistenceService) {}

  async get(): Promise<PlanningDraft | null> {
    const state = await this.storage.load();
    return state.planningDraft;
  }

  async save(draft: PlanningDraft): Promise<void> {
    const state = await this.storage.load();
    await this.storage.save({
      ...state,
      planningDraft: draft,
    });
  }

  async clear(): Promise<void> {
    const state = await this.storage.load();
    await this.storage.save({
      ...state,
      planningDraft: null,
    });
  }
}
