import type { Clock } from '@/services/clock/clock';
import type { EventBus } from '@/services/events/domain-events';
import type { PlanCandidateRepository } from '@/services/storage/repositories/plan-candidate-repository';
import type { RecommendationSetRepository } from '@/services/storage/repositories/recommendation-set-repository';
import { recommendationSetFromExperiments } from '@/features/experiment/experiment-recommendation-mapper';
import type { Experiment } from '@/features/experiment/experiment-types';
import type { RecommendationSet } from '@/features/recommendation/recommendation-set-types';

export interface GenerateExperimentRecommendationsUseCaseDeps {
  readonly recommendationSets: RecommendationSetRepository;
  readonly candidates: PlanCandidateRepository;
  readonly events: EventBus;
  readonly clock: Clock;
}

export interface GenerateExperimentRecommendationsInput {
  readonly experiments: readonly Experiment[];
  readonly presetId: string;
}

export type GenerateExperimentRecommendationsSuccess = {
  readonly ok: true;
  readonly recommendationSet: RecommendationSet;
};

export type GenerateExperimentRecommendationsFailure = {
  readonly ok: false;
  readonly reason: 'no-valid-experiments';
};

export type GenerateExperimentRecommendationsResult =
  | GenerateExperimentRecommendationsSuccess
  | GenerateExperimentRecommendationsFailure;

/**
 * Experiment[] → RecommendationSet (source=scenario) — cùng aggregate với Capital.
 */
export class GenerateExperimentRecommendationsUseCase {
  constructor(private readonly deps: GenerateExperimentRecommendationsUseCaseDeps) {}

  async execute(
    input: GenerateExperimentRecommendationsInput,
  ): Promise<GenerateExperimentRecommendationsResult> {
    const generatedAt = this.deps.clock.now().toISOString();
    const recommendationSet = recommendationSetFromExperiments(
      input.experiments,
      input.presetId,
      generatedAt,
    );
    if (recommendationSet === null) {
      return { ok: false, reason: 'no-valid-experiments' };
    }

    await this.deps.candidates.clear();
    await this.deps.recommendationSets.save(recommendationSet);

    this.deps.events.emit(
      this.deps.events.createEvent('RecommendationGenerated', {
        setId: recommendationSet.setId,
        source: 'scenario',
        recommendationCount: recommendationSet.recommendations.length,
        presetId: recommendationSet.presetId,
      }),
    );

    return { ok: true, recommendationSet };
  }
}

export function createGenerateExperimentRecommendationsUseCase(
  deps: GenerateExperimentRecommendationsUseCaseDeps,
): GenerateExperimentRecommendationsUseCase {
  return new GenerateExperimentRecommendationsUseCase(deps);
}
