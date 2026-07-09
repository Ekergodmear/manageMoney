import type { Clock } from '@/services/clock/clock';
import type { EventBus } from '@/services/events/domain-events';
import type { PlanCandidateRepository } from '@/services/storage/repositories/plan-candidate-repository';
import type { RecommendationSetRepository } from '@/services/storage/repositories/recommendation-set-repository';
import { planCapitalStrategy } from '@/features/capital/capital-planner-service';
import type { CapitalPlannerInput } from '@/features/capital/capital-planner-types';
import { recommendationSetFromCapitalResult } from '@/features/capital/capital-recommendation-mapper';
import type { RecommendationSet } from '@/features/recommendation/recommendation-set-types';
import type { PersistedAppState } from '@/features/session/session-types';

export interface GenerateCapitalRecommendationsUseCaseDeps {
  readonly recommendationSets: RecommendationSetRepository;
  readonly candidates: PlanCandidateRepository;
  readonly events: EventBus;
  readonly clock: Clock;
}

export type GenerateCapitalRecommendationsSuccess = {
  readonly ok: true;
  readonly recommendationSet: RecommendationSet;
  readonly nextState: PersistedAppState;
};

export type GenerateCapitalRecommendationsFailure = {
  readonly ok: false;
  readonly reason: 'no-strategy';
};

export type GenerateCapitalRecommendationsResult =
  | GenerateCapitalRecommendationsSuccess
  | GenerateCapitalRecommendationsFailure;

export class GenerateCapitalRecommendationsUseCase {
  constructor(private readonly deps: GenerateCapitalRecommendationsUseCaseDeps) {}

  async execute(input: CapitalPlannerInput): Promise<GenerateCapitalRecommendationsResult> {
    const planned = planCapitalStrategy(input);
    if (planned === null) {
      return { ok: false, reason: 'no-strategy' };
    }

    const generatedAt = this.deps.clock.now().toISOString();
    const recommendationSet = recommendationSetFromCapitalResult(planned, generatedAt);
    const state = await this.deps.candidates.loadState();
    const nextState: PersistedAppState = {
      ...state,
      planCandidate: null,
      recommendationSet,
      activePresetId: input.presetId,
      capitalPlanner: {
        totalBankroll: input.bankroll,
        strategy: input.strategy,
        risk: input.risk,
        presetId: input.presetId,
        marketId: input.baseForm.marketId,
      },
    };
    await this.deps.candidates.saveState(nextState);

    this.deps.events.emit(
      this.deps.events.createEvent('RecommendationGenerated', {
        setId: recommendationSet.setId,
        source: 'capital',
        recommendationCount: recommendationSet.recommendations.length,
        presetId: recommendationSet.presetId,
      }),
    );

    return { ok: true, recommendationSet, nextState };
  }
}

export function createGenerateCapitalRecommendationsUseCase(
  deps: GenerateCapitalRecommendationsUseCaseDeps,
): GenerateCapitalRecommendationsUseCase {
  return new GenerateCapitalRecommendationsUseCase(deps);
}
