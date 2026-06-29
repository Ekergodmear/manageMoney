import type { Clock } from '@/services/clock/clock';
import type { EventBus } from '@/services/events/domain-events';
import type { PlanCandidateRepository } from '@/services/storage/repositories/plan-candidate-repository';
import type { RecommendationSetRepository } from '@/services/storage/repositories/recommendation-set-repository';
import {
  createPlanCandidateFromRecommendation,
  type PlanCandidate,
} from '@/features/planning/plan-candidate-types';
import { findRecommendation } from '@/features/recommendation/recommendation-set-types';

export interface CreateCandidateFromRecommendationUseCaseDeps {
  readonly recommendationSets: RecommendationSetRepository;
  readonly candidates: PlanCandidateRepository;
  readonly events: EventBus;
  readonly clock: Clock;
}

export interface CreateCandidateFromRecommendationInput {
  readonly recommendationId: string;
}

export type CreateCandidateFromRecommendationSuccess = {
  readonly ok: true;
  readonly candidate: PlanCandidate;
};

export type CreateCandidateFromRecommendationFailure = {
  readonly ok: false;
  readonly reason: 'no-recommendation-set' | 'recommendation-not-found';
};

export type CreateCandidateFromRecommendationResult =
  | CreateCandidateFromRecommendationSuccess
  | CreateCandidateFromRecommendationFailure;

/**
 * Recommendation → PlanCandidate (một active candidate).
 */
export class CreateCandidateFromRecommendationUseCase {
  constructor(private readonly deps: CreateCandidateFromRecommendationUseCaseDeps) {}

  async execute(
    input: CreateCandidateFromRecommendationInput,
  ): Promise<CreateCandidateFromRecommendationResult> {
    const set = await this.deps.recommendationSets.get();
    if (set === null) {
      return { ok: false, reason: 'no-recommendation-set' };
    }

    const recommendation = findRecommendation(set, input.recommendationId);
    if (recommendation === undefined) {
      return { ok: false, reason: 'recommendation-not-found' };
    }

    await this.deps.recommendationSets.select(input.recommendationId);

    const createdAt = this.deps.clock.now().toISOString();
    const candidate = createPlanCandidateFromRecommendation({
      recommendationId: recommendation.recommendationId,
      presetId: set.presetId,
      source: set.source === 'capital' ? 'capital' : 'scenario',
      formValues: recommendation.formValues,
      generated: recommendation.generated,
      label: recommendation.label,
      createdAt,
    });

    await this.deps.candidates.save(candidate);

    this.deps.events.emit(
      this.deps.events.createEvent('RecommendationSelected', {
        setId: set.setId,
        source: set.source,
        recommendationId: recommendation.recommendationId,
      }),
    );

    this.deps.events.emit(
      this.deps.events.createEvent('ImprovementCandidateCreated', {
        candidateId: candidate.candidateId,
        sessionId: null,
        parentPlanId: null,
        source: candidate.source,
      }),
    );

    return { ok: true, candidate };
  }
}

export function createCandidateFromRecommendationUseCase(
  deps: CreateCandidateFromRecommendationUseCaseDeps,
): CreateCandidateFromRecommendationUseCase {
  return new CreateCandidateFromRecommendationUseCase(deps);
}
