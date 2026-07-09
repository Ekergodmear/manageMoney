import { describe, expect, it } from 'vitest';

import { FakeClock } from '@/services/clock/fake-clock';
import { applyPresetToForm } from '@/features/game-designer/preset-utils';
import { mergePresets } from '@/features/game-designer/preset-utils';
import { DEFAULT_PLANNER_FORM } from '@/features/planner/plan-service';
import { createCandidateFromRecommendationUseCase } from '@/features/capital/create-candidate-from-recommendation-use-case';
import { createGenerateCapitalRecommendationsUseCase } from '@/features/capital/generate-capital-recommendations-use-case';
import { createPromoteCandidateToSessionUseCase } from '@/features/capital/promote-candidate-to-session-use-case';
import { getCurrentPlan } from '@/features/session/session-domain';
import { MemoryStorageDriver } from '@/services/storage/MemoryStorageDriver';
import { PersistenceService } from '@/services/storage/PersistenceService';
import { PlanCandidateRepository } from '@/services/storage/repositories/plan-candidate-repository';
import { SessionRepository } from '@/services/storage/repositories/session-repository';
import { RecommendationSetRepository } from '@/services/storage/repositories/recommendation-set-repository';
import { EventBus } from '@/services/events/domain-events';
import { EMPTY_PERSISTED_STATE } from '@/features/session/session-types';

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

describe('Capital — RecommendationSet → Candidate → Session', () => {
  it('GenerateCapitalRecommendations saves RecommendationSet and emits event', async () => {
    const deps = createDeps();
    await deps.driver.put('app-state', EMPTY_PERSISTED_STATE);

    const presets = mergePresets([]);
    const preset = presets.find((p) => p.id === 'bingo-120');
    expect(preset).toBeDefined();
    if (preset === undefined) {
      return;
    }

    const baseForm = applyPresetToForm(
      { ...DEFAULT_PLANNER_FORM, userBankroll: '30.000.000' },
      preset,
    );

    const generate = createGenerateCapitalRecommendationsUseCase({
      recommendationSets: deps.recommendationSets,
      candidates: deps.candidates,
      events: deps.events,
      clock: deps.clock,
    });

    let generated = false;
    deps.events.subscribe('RecommendationGenerated', () => {
      generated = true;
    });

    const result = await generate.execute({
      bankroll: 30_000_000,
      presetId: preset.id,
      baseForm,
      strategy: 'balanced',
      risk: 'normal',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(generated).toBe(true);
    expect(result.recommendationSet.recommendations.length).toBeGreaterThan(0);

    const state = await deps.storage.load();
    expect(state.recommendationSet?.setId).toBe(result.recommendationSet.setId);
  });

  it('CreateCandidateFromRecommendation → PromoteCandidateToSession creates capital session', async () => {
    const deps = createDeps();
    await deps.driver.put('app-state', EMPTY_PERSISTED_STATE);

    const presets = mergePresets([]);
    const preset = presets.find((p) => p.id === 'bingo-120');
    expect(preset).toBeDefined();
    if (preset === undefined) {
      return;
    }

    const baseForm = applyPresetToForm(
      { ...DEFAULT_PLANNER_FORM, userBankroll: '30.000.000' },
      preset,
    );

    const generate = createGenerateCapitalRecommendationsUseCase({
      recommendationSets: deps.recommendationSets,
      candidates: deps.candidates,
      events: deps.events,
      clock: deps.clock,
    });
    const createCandidate = createCandidateFromRecommendationUseCase({
      recommendationSets: deps.recommendationSets,
      candidates: deps.candidates,
      events: deps.events,
      clock: deps.clock,
    });
    const promote = createPromoteCandidateToSessionUseCase({
      candidates: deps.candidates,
      sessions: deps.sessions,
      events: deps.events,
      clock: deps.clock,
    });

    const generated = await generate.execute({
      bankroll: 30_000_000,
      presetId: preset.id,
      baseForm,
      strategy: 'balanced',
      risk: 'normal',
    });
    expect(generated.ok).toBe(true);
    if (!generated.ok) {
      return;
    }

    const recommendationId = generated.recommendationSet.recommendations[0]?.recommendationId;
    expect(recommendationId).toBeDefined();
    if (recommendationId === undefined) {
      return;
    }

    let selected = false;
    let candidateCreated = false;
    let sessionCreated = false;
    let planPromoted = false;
    deps.events.subscribe('RecommendationSelected', () => {
      selected = true;
    });
    deps.events.subscribe('ImprovementCandidateCreated', () => {
      candidateCreated = true;
    });
    deps.events.subscribe('SessionCreated', () => {
      sessionCreated = true;
    });
    deps.events.subscribe('PlanPromoted', () => {
      planPromoted = true;
    });

    const created = await createCandidate.execute({ recommendationId });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    expect(selected).toBe(true);
    expect(candidateCreated).toBe(true);
    expect(created.candidate.target).toBe('new-session');
    expect(created.candidate.source).toBe('capital');

    const promoted = await promote.execute();
    expect(promoted.ok).toBe(true);
    if (!promoted.ok) {
      return;
    }
    expect(sessionCreated).toBe(true);
    expect(planPromoted).toBe(true);

    const session = promoted.nextState.sessions[0];
    expect(session).toBeDefined();
    if (session === undefined) {
      return;
    }
    const plan = getCurrentPlan(session);
    expect(plan?.origin).toBe('capital');
    expect(promoted.nextState.planCandidate).toBeNull();
    expect(promoted.nextState.activeSessionId).toBe(session.id);

    const timeline = session.timeline.at(-1);
    expect(timeline?.type).toBe('plan-added');
    expect(timeline?.origin).toBe('capital');
  });

  it('re-generate overwrites RecommendationSet and discards candidate', async () => {
    const deps = createDeps();
    await deps.driver.put('app-state', EMPTY_PERSISTED_STATE);

    const presets = mergePresets([]);
    const preset = presets.find((p) => p.id === 'bingo-120');
    expect(preset).toBeDefined();
    if (preset === undefined) {
      return;
    }

    const baseForm = applyPresetToForm(
      { ...DEFAULT_PLANNER_FORM, userBankroll: '30.000.000' },
      preset,
    );

    const generate = createGenerateCapitalRecommendationsUseCase({
      recommendationSets: deps.recommendationSets,
      candidates: deps.candidates,
      events: deps.events,
      clock: deps.clock,
    });
    const createCandidate = createCandidateFromRecommendationUseCase({
      recommendationSets: deps.recommendationSets,
      candidates: deps.candidates,
      events: deps.events,
      clock: deps.clock,
    });

    const first = await generate.execute({
      bankroll: 30_000_000,
      presetId: preset.id,
      baseForm,
      strategy: 'balanced',
      risk: 'normal',
    });
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }

    const recommendationId = first.recommendationSet.recommendations[0]?.recommendationId;
    expect(recommendationId).toBeDefined();
    if (recommendationId === undefined) {
      return;
    }

    await createCandidate.execute({ recommendationId });
    let state = await deps.storage.load();
    expect(state.planCandidate).not.toBeNull();

    const second = await generate.execute({
      bankroll: 30_000_000,
      presetId: preset.id,
      baseForm,
      strategy: 'max-profit',
      risk: 'aggressive',
    });
    expect(second.ok).toBe(true);
    if (!second.ok) {
      return;
    }

    state = await deps.storage.load();
    expect(state.planCandidate).toBeNull();
    expect(state.recommendationSet?.setId).toBe(second.recommendationSet.setId);
    expect(state.recommendationSet?.setId).not.toBe(first.recommendationSet.setId);
  });

  it('promote clears RecommendationSet and candidate', async () => {
    const deps = createDeps();
    await deps.driver.put('app-state', EMPTY_PERSISTED_STATE);

    const presets = mergePresets([]);
    const preset = presets.find((p) => p.id === 'bingo-120');
    expect(preset).toBeDefined();
    if (preset === undefined) {
      return;
    }

    const baseForm = applyPresetToForm(
      { ...DEFAULT_PLANNER_FORM, userBankroll: '30.000.000' },
      preset,
    );

    const generate = createGenerateCapitalRecommendationsUseCase({
      recommendationSets: deps.recommendationSets,
      candidates: deps.candidates,
      events: deps.events,
      clock: deps.clock,
    });
    const createCandidate = createCandidateFromRecommendationUseCase({
      recommendationSets: deps.recommendationSets,
      candidates: deps.candidates,
      events: deps.events,
      clock: deps.clock,
    });
    const promote = createPromoteCandidateToSessionUseCase({
      candidates: deps.candidates,
      sessions: deps.sessions,
      events: deps.events,
      clock: deps.clock,
    });

    const generated = await generate.execute({
      bankroll: 30_000_000,
      presetId: preset.id,
      baseForm,
      strategy: 'balanced',
      risk: 'normal',
    });
    expect(generated.ok).toBe(true);
    if (!generated.ok) {
      return;
    }

    const recommendationId = generated.recommendationSet.recommendations[0]?.recommendationId;
    if (recommendationId === undefined) {
      return;
    }

    await createCandidate.execute({ recommendationId });
    const promoted = await promote.execute();
    expect(promoted.ok).toBe(true);
    if (!promoted.ok) {
      return;
    }

    expect(promoted.nextState.planCandidate).toBeNull();
    expect(promoted.nextState.recommendationSet).toBeNull();
  });
});
