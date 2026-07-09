import type { PlanCandidate } from '@/features/planning/plan-candidate-types';
import type { PersistedAppState } from '@/features/session/session-types';
import type { PersistenceService } from '@/services/storage/PersistenceService';

/**
 * Persistence owner for the singleton `planCandidate` slot.
 * Invariant: at most one active candidate — save always replaces the slot.
 */
export class PlanCandidateRepository {
  constructor(private readonly storage: PersistenceService) {}

  async loadState(): Promise<PersistedAppState> {
    return this.storage.load();
  }

  async saveState(state: PersistedAppState): Promise<void> {
    return this.storage.save(state);
  }

  async get(): Promise<PlanCandidate | null> {
    const state = await this.loadState();
    return state.planCandidate;
  }

  async saveCandidate(candidate: PlanCandidate): Promise<PersistedAppState> {
    const state = await this.loadState();
    const next: PersistedAppState = {
      ...state,
      planCandidate: candidate,
    };
    await this.saveState(next);
    return next;
  }

  async save(candidate: PlanCandidate): Promise<void> {
    await this.saveCandidate(candidate);
  }

  async clearCandidate(): Promise<PersistedAppState> {
    const state = await this.loadState();
    const next: PersistedAppState = {
      ...state,
      planCandidate: null,
    };
    await this.saveState(next);
    return next;
  }

  async clear(): Promise<void> {
    await this.clearCandidate();
  }
}
