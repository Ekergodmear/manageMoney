import type { PlanCandidate } from '@/features/planning/plan-candidate-types';
import type { PersistenceService } from '@/services/storage/PersistenceService';

export class PlanCandidateRepository {
  constructor(private readonly storage: PersistenceService) {}

  async get(): Promise<PlanCandidate | null> {
    const state = await this.storage.load();
    return state.planCandidate;
  }

  async save(candidate: PlanCandidate): Promise<void> {
    const state = await this.storage.load();
    await this.storage.save({
      ...state,
      planCandidate: candidate,
    });
  }

  async clear(): Promise<void> {
    const state = await this.storage.load();
    await this.storage.save({
      ...state,
      planCandidate: null,
    });
  }
}
