import { describe, expect, it, vi } from 'vitest';

import { FakeClock } from '@/services/clock/fake-clock';
import { applyPresetToForm, mergePresets } from '@/features/game-designer/preset-utils';
import { createBaselineExperiment, forkExperiment } from '@/features/experiment/experiment-engine';
import { createGenerateExperimentRecommendationsUseCase } from '@/features/experiment/generate-experiment-recommendations-use-case';
import { createCandidateFromRecommendationUseCase } from '@/features/capital/create-candidate-from-recommendation-use-case';
import { DEFAULT_PLANNER_FORM } from '@/features/planner/plan-service';
import { MemoryStorageDriver } from '@/services/storage/MemoryStorageDriver';
import { PersistenceService } from '@/services/storage/PersistenceService';
import { PlanCandidateRepository } from '@/services/storage/repositories/plan-candidate-repository';
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
  };
}

describe('R2.2.5c single write experiment', () => {
  it('use experiment → reload → candidate persisted', async () => {
    const deps = createDeps();
    await deps.driver.put('app-state', EMPTY_PERSISTED_STATE);

    const presets = mergePresets([]);
    const preset = presets.find((p) => p.id === 'bingo-120');
    if (preset === undefined) {
      throw new Error('preset missing');
    }

    const baseForm = applyPresetToForm(BASE_FORM, preset);
    const baseline = createBaselineExperiment(baseForm, preset.id);
    const variant = forkExperiment(
      baseForm,
      baseline.result === null ? [] : [baseline],
      { winTaxEnabled: true, winTaxRatePercent: '20' },
      'Tax 20%',
    );
    if (baseline.result === null || variant.result === null) {
      throw new Error('experiment failed');
    }

    const generate = createGenerateExperimentRecommendationsUseCase({
      recommendationSets: deps.recommendationSets,
      candidates: deps.candidates,
      events: deps.events,
      clock: deps.clock,
    });
    await generate.execute({ experiments: [baseline, variant], presetId: preset.id });

    const createCandidate = createCandidateFromRecommendationUseCase({
      recommendationSets: deps.recommendationSets,
      candidates: deps.candidates,
      events: deps.events,
      clock: deps.clock,
    });
    const picked = await createCandidate.execute({ recommendationId: variant.id });
    expect(picked.ok).toBe(true);
    if (!picked.ok) {
      return;
    }

    const reloaded = await deps.storage.load();
    expect(reloaded.planCandidate?.candidateId).toBe(picked.candidate.candidateId);
    expect(reloaded.planCandidate?.source).toBe('scenario');
  });

  it('pick experiment candidate → one PersistenceService.save()', async () => {
    const deps = createDeps();
    await deps.driver.put('app-state', EMPTY_PERSISTED_STATE);

    const presets = mergePresets([]);
    const preset = presets.find((p) => p.id === 'bingo-120');
    if (preset === undefined) {
      throw new Error('preset missing');
    }

    const baseForm = applyPresetToForm(BASE_FORM, preset);
    const baseline = createBaselineExperiment(baseForm, preset.id);
    if (baseline.result === null) {
      throw new Error('baseline failed');
    }

    const generate = createGenerateExperimentRecommendationsUseCase({
      recommendationSets: deps.recommendationSets,
      candidates: deps.candidates,
      events: deps.events,
      clock: deps.clock,
    });
    await generate.execute({ experiments: [baseline], presetId: preset.id });

    const createCandidate = createCandidateFromRecommendationUseCase({
      recommendationSets: deps.recommendationSets,
      candidates: deps.candidates,
      events: deps.events,
      clock: deps.clock,
    });
    const saveSpy = vi.spyOn(deps.storage, 'save');
    const picked = await createCandidate.execute({ recommendationId: baseline.id });
    expect(picked.ok).toBe(true);
    expect(saveSpy).toHaveBeenCalledTimes(1);
    saveSpy.mockRestore();
  });
});
