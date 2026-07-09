import { describe, expect, it, vi } from 'vitest';

import { FakeClock } from '@/services/clock/fake-clock';
import { applyPresetToForm, mergePresets } from '@/features/game-designer/preset-utils';
import { DEFAULT_PLANNER_FORM, generatePlan } from '@/features/planner/plan-service';
import { createDeletePlanCandidateUseCase } from '@/features/planning/candidate-use-cases';
import { createCandidateFromRecommendationUseCase } from '@/features/capital/create-candidate-from-recommendation-use-case';
import { createPromoteCandidateToSessionUseCase } from '@/features/capital/promote-candidate-to-session-use-case';
import type { RecommendationSet } from '@/features/recommendation/recommendation-set-types';
import { MemoryStorageDriver } from '@/services/storage/MemoryStorageDriver';
import { PersistenceService } from '@/services/storage/PersistenceService';
import { PlanCandidateRepository } from '@/services/storage/repositories/plan-candidate-repository';
import { SessionRepository } from '@/services/storage/repositories/session-repository';
import { RecommendationSetRepository } from '@/services/storage/repositories/recommendation-set-repository';
import { EventBus } from '@/services/events/domain-events';
import { EMPTY_PERSISTED_STATE } from '@/features/session/session-types';

const CAPITAL_FORM = {
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
  const clock = new FakeClock(new Date('2026-06-25T16:00:00.000Z'));
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

function capitalInput() {
  const presets = mergePresets([]);
  const preset = presets.find((p) => p.id === 'bingo-120');
  if (preset === undefined) {
    throw new Error('preset missing');
  }
  const baseForm = applyPresetToForm(CAPITAL_FORM, preset);
  return {
    bankroll: 5_000_000,
    presetId: preset.id,
    baseForm,
    strategy: 'balanced' as const,
    risk: 'normal' as const,
  };
}

async function seedRecommendationSet(deps: ReturnType<typeof createDeps>): Promise<RecommendationSet> {
  const input = capitalInput();
  const generated = generatePlan(input.baseForm);
  if (generated.result === undefined) {
    throw new Error('generate failed');
  }
  const recommendationId = 'rec-capital-test';
  const set: RecommendationSet = {
    setId: 'set-capital-test',
    source: 'capital',
    totalBankroll: input.bankroll,
    usableBankroll: input.bankroll,
    reserve: 0,
    strategy: input.strategy,
    risk: input.risk,
    presetId: input.presetId,
    marketId: input.baseForm.marketId,
    recommendations: [
      {
        recommendationId,
        label: 'Capital test',
        marketId: input.baseForm.marketId,
        allocatedCapital: input.bankroll,
        targetProfit: 50_000,
        roundCount: 20,
        requiredBankroll: generated.result.statistics.requiredBankrollAmount,
        maxBet: generated.result.statistics.maximumBetAmount,
        safety: 'safe',
        formValues: input.baseForm,
        generated: generated.result,
      },
    ],
    totalTargetProfit: 50_000,
    selectedRecommendationId: null,
    generatedAt: '2026-06-25T16:00:00.000Z',
  };
  await deps.driver.put('app-state', {
    ...EMPTY_PERSISTED_STATE,
    recommendationSet: set,
    capitalPlanner: {
      totalBankroll: input.bankroll,
      strategy: input.strategy,
      risk: input.risk,
      presetId: input.presetId,
      marketId: input.baseForm.marketId,
    },
  });
  return set;
}

describe('R2.2.5a single write capital', () => {
  it('pick recommendation → reload → candidate persisted', async () => {
    const deps = createDeps();
    const set = await seedRecommendationSet(deps);
    const recommendationId = set.recommendations[0]?.recommendationId;
    expect(recommendationId).toBeDefined();
    if (recommendationId === undefined) {
      return;
    }

    const createCandidate = createCandidateFromRecommendationUseCase({
      recommendationSets: deps.recommendationSets,
      candidates: deps.candidates,
      events: deps.events,
      clock: deps.clock,
    });
    const picked = await createCandidate.execute({ recommendationId });
    expect(picked.ok).toBe(true);
    if (!picked.ok) {
      return;
    }

    const reloaded = await deps.storage.load();
    expect(reloaded.planCandidate?.candidateId).toBe(picked.candidate.candidateId);
    expect(reloaded.recommendationSet?.selectedRecommendationId).toBe(recommendationId);
  });

  it('promote candidate → reload → session created', async () => {
    const deps = createDeps();
    const set = await seedRecommendationSet(deps);
    const recommendationId = set.recommendations[0]?.recommendationId;
    if (recommendationId === undefined) {
      return;
    }

    const createCandidate = createCandidateFromRecommendationUseCase({
      recommendationSets: deps.recommendationSets,
      candidates: deps.candidates,
      events: deps.events,
      clock: deps.clock,
    });
    await createCandidate.execute({ recommendationId });

    const promote = createPromoteCandidateToSessionUseCase({
      candidates: deps.candidates,
      sessions: deps.sessions,
      events: deps.events,
      clock: deps.clock,
    });
    const promoted = await promote.execute();
    expect(promoted.ok).toBe(true);

    const reloaded = await deps.storage.load();
    expect(reloaded.planCandidate).toBeNull();
    expect(reloaded.sessions).toHaveLength(1);
    expect(reloaded.activeSessionId).not.toBeNull();
  });

  it('discard candidate → reload → candidate cleared', async () => {
    const deps = createDeps();
    const set = await seedRecommendationSet(deps);
    const recommendationId = set.recommendations[0]?.recommendationId;
    if (recommendationId === undefined) {
      return;
    }

    const createCandidate = createCandidateFromRecommendationUseCase({
      recommendationSets: deps.recommendationSets,
      candidates: deps.candidates,
      events: deps.events,
      clock: deps.clock,
    });
    await createCandidate.execute({ recommendationId });

    const discard = createDeletePlanCandidateUseCase({ candidates: deps.candidates });
    const removed = await discard.execute();
    expect(removed.ok).toBe(true);

    const reloaded = await deps.storage.load();
    expect(reloaded.planCandidate).toBeNull();
  });

  it('one domain mutation → one PersistenceService.save()', async () => {
    const deps = createDeps();
    await seedRecommendationSet(deps);

    const createCandidate = createCandidateFromRecommendationUseCase({
      recommendationSets: deps.recommendationSets,
      candidates: deps.candidates,
      events: deps.events,
      clock: deps.clock,
    });
    const saveSpy = vi.spyOn(deps.storage, 'save');
    const recommendationId = 'rec-capital-test';

    const result = await createCandidate.execute({ recommendationId });
    expect(result.ok).toBe(true);
    expect(saveSpy).toHaveBeenCalledTimes(1);

    saveSpy.mockRestore();
  });
});
