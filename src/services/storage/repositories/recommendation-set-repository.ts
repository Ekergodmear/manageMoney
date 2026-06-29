import type { RecommendationSet } from '@/features/recommendation/recommendation-set-types';
import type { PersistenceService } from '@/services/storage/PersistenceService';

export class RecommendationSetRepository {
  constructor(private readonly storage: PersistenceService) {}

  async get(): Promise<RecommendationSet | null> {
    const state = await this.storage.load();
    return state.recommendationSet;
  }

  async save(set: RecommendationSet): Promise<void> {
    const state = await this.storage.load();
    await this.storage.save({
      ...state,
      recommendationSet: set,
    });
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
    const state = await this.storage.load();
    await this.storage.save({
      ...state,
      recommendationSet: null,
    });
  }
}
