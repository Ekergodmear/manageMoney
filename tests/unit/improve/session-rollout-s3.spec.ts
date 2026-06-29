import { describe, expect, it } from 'vitest';

import { FakeClock } from '@/services/clock/fake-clock';
import { runImproveForMode } from '@/features/improve/improve-service';
import { createImprovementCandidateUseCase } from '@/features/improve/create-improvement-candidate-use-case';
import { createPromoteCandidateToPlanUseCase } from '@/features/improve/promote-candidate-to-plan-use-case';
import { createSessionFromGenerate } from '@/features/session/session-factory';
import { getCurrentPlan } from '@/features/session/session-domain';
import { DEFAULT_PLANNER_FORM } from '@/features/planner/plan-service';
import { generatePlan } from '@/features/planner/plan-service';
import { MemoryStorageDriver } from '@/services/storage/MemoryStorageDriver';
import { PersistenceService } from '@/services/storage/PersistenceService';
import { PlanCandidateRepository } from '@/services/storage/repositories/plan-candidate-repository';
import { SessionRepository } from '@/services/storage/repositories/session-repository';
import { EventBus } from '@/services/events/domain-events';
import { EMPTY_PERSISTED_STATE } from '@/features/session/session-types';

const IMPROVE_FORM = {
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
  const clock = new FakeClock(new Date('2026-06-25T14:00:00.000Z'));
  const events = new EventBus(clock);
  const storage = new PersistenceService(driver, events);
  return {
    driver,
    clock,
    events,
    storage,
    candidates: new PlanCandidateRepository(storage),
    sessions: new SessionRepository(storage),
  };
}

describe('S3 — Improve candidate pipeline', () => {
  it('CreateImprovementCandidate → review state without mutating session plans', async () => {
    const deps = createDeps();
    const generated = generatePlan(IMPROVE_FORM);
    expect(generated.result).toBeDefined();
    if (generated.result === undefined) {
      return;
    }

    const session = createSessionFromGenerate(
      IMPROVE_FORM,
      generated.result,
      'bingo-120',
      1,
    );
    await deps.driver.put('app-state', {
      ...EMPTY_PERSISTED_STATE,
      activeSessionId: session.id,
      sessions: [session],
    });

    const option = runImproveForMode(
      { formValues: IMPROVE_FORM, generated: generated.result },
      'keep-profit',
    );
    expect(option).not.toBeNull();
    if (option === null) {
      return;
    }

    const createCandidate = createImprovementCandidateUseCase({
      candidates: deps.candidates,
      sessions: deps.sessions,
      events: deps.events,
      clock: deps.clock,
    });

    const result = await createCandidate.execute({ sessionId: session.id, option });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const state = await deps.storage.load();
    expect(state.planCandidate?.candidateId).toBe(result.candidate.candidateId);
    expect(state.sessions[0]?.plans).toHaveLength(1);
  });

  it('PromoteCandidateToPlan → Plan B with plan-added timeline and cleared candidate', async () => {
    const deps = createDeps();
    const generated = generatePlan(IMPROVE_FORM);
    expect(generated.result).toBeDefined();
    if (generated.result === undefined) {
      return;
    }

    const session = createSessionFromGenerate(
      IMPROVE_FORM,
      generated.result,
      'bingo-120',
      1,
    );
    await deps.driver.put('app-state', {
      ...EMPTY_PERSISTED_STATE,
      activeSessionId: session.id,
      sessions: [session],
    });

    const option = runImproveForMode(
      { formValues: IMPROVE_FORM, generated: generated.result },
      'keep-profit',
    );
    expect(option).not.toBeNull();
    if (option === null) {
      return;
    }

    const createCandidate = createImprovementCandidateUseCase({
      candidates: deps.candidates,
      sessions: deps.sessions,
      events: deps.events,
      clock: deps.clock,
    });
    const promote = createPromoteCandidateToPlanUseCase({
      candidates: deps.candidates,
      sessions: deps.sessions,
      events: deps.events,
      clock: deps.clock,
    });

    await createCandidate.execute({ sessionId: session.id, option });

    let planPromoted = false;
    deps.events.subscribe('PlanPromoted', () => {
      planPromoted = true;
    });

    const promoted = await promote.execute();
    expect(promoted.ok).toBe(true);
    if (!promoted.ok) {
      return;
    }

    expect(planPromoted).toBe(true);
    expect(promoted.session.plans).toHaveLength(2);
    const current = getCurrentPlan(promoted.session);
    expect(current?.origin).toBe('improve');
    expect(current?.label).toBe('Plan B');

    const lastTimeline = promoted.session.timeline.at(-1);
    expect(lastTimeline?.type).toBe('plan-added');
    expect(lastTimeline?.origin).toBe('improve');

    const state = await deps.storage.load();
    expect(state.planCandidate).toBeNull();
  });

  it('cancel review keeps candidate until discard', async () => {
    const deps = createDeps();
    const generated = generatePlan(IMPROVE_FORM);
    expect(generated.result).toBeDefined();
    if (generated.result === undefined) {
      return;
    }

    const session = createSessionFromGenerate(
      IMPROVE_FORM,
      generated.result,
      'bingo-120',
      1,
    );
    await deps.driver.put('app-state', {
      ...EMPTY_PERSISTED_STATE,
      activeSessionId: session.id,
      sessions: [session],
    });

    const option = runImproveForMode(
      { formValues: IMPROVE_FORM, generated: generated.result },
      'keep-profit',
    );
    expect(option).not.toBeNull();
    if (option === null) {
      return;
    }

    const createCandidate = createImprovementCandidateUseCase({
      candidates: deps.candidates,
      sessions: deps.sessions,
      events: deps.events,
      clock: deps.clock,
    });

    const created = await createCandidate.execute({ sessionId: session.id, option });
    expect(created.ok).toBe(true);

    const afterCreate = await deps.storage.load();
    expect(afterCreate.planCandidate).not.toBeNull();
    expect(afterCreate.sessions[0]?.plans).toHaveLength(1);

    await deps.candidates.clear();
    const afterDiscard = await deps.storage.load();
    expect(afterDiscard.planCandidate).toBeNull();
  });

  it('new candidate overwrites previous active candidate', async () => {
    const deps = createDeps();
    const generated = generatePlan(IMPROVE_FORM);
    expect(generated.result).toBeDefined();
    if (generated.result === undefined) {
      return;
    }

    const session = createSessionFromGenerate(
      IMPROVE_FORM,
      generated.result,
      'bingo-120',
      1,
    );
    await deps.driver.put('app-state', {
      ...EMPTY_PERSISTED_STATE,
      activeSessionId: session.id,
      sessions: [session],
    });

    const optionA = runImproveForMode(
      { formValues: IMPROVE_FORM, generated: generated.result },
      'keep-profit',
    );
    const optionB = runImproveForMode(
      { formValues: IMPROVE_FORM, generated: generated.result },
      'keep-rounds',
    );
    expect(optionA).not.toBeNull();
    expect(optionB).not.toBeNull();
    if (optionA === null || optionB === null) {
      return;
    }

    const createCandidate = createImprovementCandidateUseCase({
      candidates: deps.candidates,
      sessions: deps.sessions,
      events: deps.events,
      clock: deps.clock,
    });

    const first = await createCandidate.execute({ sessionId: session.id, option: optionA });
    const second = await createCandidate.execute({ sessionId: session.id, option: optionB });
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) {
      return;
    }

    const state = await deps.storage.load();
    expect(state.planCandidate?.candidateId).toBe(second.candidate.candidateId);
    expect(state.planCandidate?.mode).toBe('keep-rounds');
  });
});
