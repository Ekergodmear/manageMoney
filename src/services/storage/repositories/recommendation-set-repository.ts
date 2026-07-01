import type { RecommendationSet } from '@/features/recommendation/recommendation-set-types';
import type { PersistedAppState } from '@/features/session/session-types';
import type { PersistenceService } from '@/services/storage/PersistenceService';

export class RecommendationSetRepository {
  constructor(private readonly storage: PersistenceService) {}

  async loadState(): Promise<PersistedAppState> {
    return this.storage.load();
  }

  async saveState(state: PersistedAppState): Promise<void> {
    return this.storage.save(state);
  }

  async get(): Promise<RecommendationSet | null> {
    const state = await this.loadState();
    return state.recommendationSet;
  }

  async saveRecommendationSet(set: RecommendationSet): Promise<PersistedAppState> {
    const state = await this.loadState();
    const next: PersistedAppState = {
      ...state,
      recommendationSet: set,
    };
    await this.saveState(next);
    return next;
  }

  async save(set: RecommendationSet): Promise<void> {
    await this.saveRecommendationSet(set);
  }

  async select(recommendationId: string): Promise<RecommendationSet | null> {
    const set = await this.get();
    if (set === null) {
      return null;
    }
    const next: RecommendationSet = {
      ...set,
      selectedRecommendationId: recommendationId,
    };
    await this.save(next);
    return next;
  }

  async clear(): Promise<void> {
    const state = await this.loadState();
    await this.saveState({
      ...state,
      recommendationSet: null,
    });
  }
}
