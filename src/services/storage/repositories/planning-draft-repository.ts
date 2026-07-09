import type { PlanningDraft } from '@/features/planning/planning-types';
import type { PersistedAppState } from '@/features/session/session-types';
import type { PersistenceService } from '@/services/storage/PersistenceService';

export class PlanningDraftRepository {
  constructor(private readonly storage: PersistenceService) {}

  async loadState(): Promise<PersistedAppState> {
    return this.storage.load();
  }

  async saveState(state: PersistedAppState): Promise<void> {
    return this.storage.save(state);
  }

  async get(): Promise<PlanningDraft | null> {
    const state = await this.loadState();
    return state.planningDraft;
  }

  async saveDraft(draft: PlanningDraft): Promise<PersistedAppState> {
    const state = await this.loadState();
    const next: PersistedAppState = {
      ...state,
      planningDraft: draft,
    };
    await this.saveState(next);
    return next;
  }

  async save(draft: PlanningDraft): Promise<void> {
    await this.saveDraft(draft);
  }

  async clearDraft(): Promise<PersistedAppState> {
    const state = await this.loadState();
    const next: PersistedAppState = {
      ...state,
      planningDraft: null,
    };
    await this.saveState(next);
    return next;
  }

  async clear(): Promise<void> {
    await this.clearDraft();
  }

  async updateDraft(
    mutator: (draft: PlanningDraft) => PlanningDraft,
  ): Promise<PersistedAppState | null> {
    const state = await this.loadState();
    if (state.planningDraft === null) {
      return null;
    }
    const next: PersistedAppState = {
      ...state,
      planningDraft: mutator(state.planningDraft),
    };
    await this.saveState(next);
    return next;
  }
}
