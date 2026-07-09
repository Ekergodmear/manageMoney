import { describe, expect, it } from 'vitest';

import { FakeClock } from '@/services/clock/fake-clock';
import { applyPresetToForm, mergePresets } from '@/features/game-designer/preset-utils';
import { createBaselineExperiment, forkExperiment } from '@/features/experiment/experiment-engine';
import { createGenerateExperimentRecommendationsUseCase } from '@/features/experiment/generate-experiment-recommendations-use-case';
import { createCandidateFromRecommendationUseCase } from '@/features/capital/create-candidate-from-recommendation-use-case';
import { createPromoteCandidateToSessionUseCase } from '@/features/capital/promote-candidate-to-session-use-case';
import { DEFAULT_PLANNER_FORM } from '@/features/planner/plan-service';
import { getCurrentPlan } from '@/features/session/session-domain';
import { MemoryStorageDriver } from '@/services/storage/MemoryStorageDriver';
import { PersistenceService } from '@/services/storage/PersistenceService';
import { PlanCandidateRepository } from '@/services/storage/repositories/plan-candidate-repository';
import { SessionRepository } from '@/services/storage/repositories/session-repository';
import { RecommendationSetRepository } from '@/services/storage/repositories/recommendation-set-repository';
import { EventBus } from '@/services/events/domain-events';
import { EMPTY_PERSISTED_STATE } from '@/features/session/session-types';

const BASE_FORM = {
  ...DEFAULT_PLANNER_FORM,
  targetProfit: '50.000',
  roundCount: '20',
  rewardMultiplier: '20',
  minimumBet: '10.000',
  betStep: '10.000',
  userBankroll: '5.000.000',
  winTaxEnabled: false,
  winTaxThreshold: '',
  winTaxRatePercent: '',
};

function createDeps() {
  const driver = new MemoryStorageDriver();
  const clock = new FakeClock(new Date('2026-06-25T20:00:00.000Z'));
  const events = new EventBus(clock);
  const storage = new PersistenceService(driver, events);
  return {
    driver,
    clock,
    events,
    storage,
    recommendationSets: new RecommendationSetRepository(storage),
    candidates: new PlanCandidateRepository(storage),
    sessions: new SessionRepository(storage),
  };
}

describe('Scenario wire — Experiment → RecommendationSet → Candidate → Session', () => {
  it('full pipeline với source=scenario', async () => {
    const deps = createDeps();
    await deps.driver.put('app-state', EMPTY_PERSISTED_STATE);

    const presets = mergePresets([]);
    const preset = presets.find((p) => p.id === 'bingo-120');
    expect(preset).toBeDefined();
    if (preset === undefined) {
      return;
    }

    const baseForm = applyPresetToForm(BASE_FORM, preset);
    const baseline = createBaselineExperiment(baseForm, preset.id);
    expect(baseline.result).not.toBeNull();
    if (baseline.result === null) {
      return;
    }

    const variant = forkExperiment(
      baseForm,
      [baseline],
      { winTaxEnabled: true, winTaxRatePercent: '20' },
      'Tax 20%',
    );
    expect(variant.result).not.toBeNull();
    if (variant.result === null) {
      return;
    }

    const generate = createGenerateExperimentRecommendationsUseCase({
      recommendationSets: deps.recommendationSets,
      candidates: deps.candidates,
      events: deps.events,
      clock: deps.clock,
    });

    let generated = false;
    deps.events.subscribe('RecommendationGenerated', (event) => {
      if (event.source === 'scenario') {
        generated = true;
      }
    });

    const genResult = await generate.execute({
      experiments: [baseline, variant],
      presetId: preset.id,
    });
    expect(genResult.ok).toBe(true);
    if (!genResult.ok) {
      return;
    }
    expect(generated).toBe(true);
    expect(genResult.recommendationSet.source).toBe('scenario');
    expect(genResult.recommendationSet.recommendations).toHaveLength(2);

    const createCandidate = createCandidateFromRecommendationUseCase({
      recommendationSets: deps.recommendationSets,
      candidates: deps.candidates,
      events: deps.events,
      clock: deps.clock,
    });

    let selected = false;
    deps.events.subscribe('RecommendationSelected', (event) => {
      if (event.source === 'scenario') {
        selected = true;
      }
    });

    const candResult = await createCandidate.execute({ recommendationId: variant.id });
    expect(candResult.ok).toBe(true);
    if (!candResult.ok) {
      return;
    }
    expect(selected).toBe(true);
    expect(candResult.candidate.source).toBe('scenario');
    expect(candResult.candidate.target).toBe('new-session');

    const promote = createPromoteCandidateToSessionUseCase({
      candidates: deps.candidates,
      sessions: deps.sessions,
      events: deps.events,
      clock: deps.clock,
    });
    const promoteResult = await promote.execute();
    expect(promoteResult.ok).toBe(true);
    if (!promoteResult.ok) {
      return;
    }

    const session = promoteResult.nextState.sessions[0];
    expect(session).toBeDefined();
    if (session === undefined) {
      return;
    }
    const plan = getCurrentPlan(session);
    expect(plan?.origin).toBe('scenario');
    expect(promoteResult.nextState.recommendationSet).toBeNull();
    expect(promoteResult.nextState.planCandidate).toBeNull();
  });
});
