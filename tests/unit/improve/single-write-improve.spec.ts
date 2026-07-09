import { describe, expect, it, vi } from 'vitest';

import { FakeClock } from '@/services/clock/fake-clock';
import { runImproveForMode } from '@/features/improve/improve-service';
import { createImprovementCandidateUseCase } from '@/features/improve/create-improvement-candidate-use-case';
import { createPromoteCandidateToPlanUseCase } from '@/features/improve/promote-candidate-to-plan-use-case';
import { createTestSessionFromGenerate } from '../../support/create-test-session';
import { getCurrentPlan } from '@/features/session/session-domain';
import { DEFAULT_PLANNER_FORM, generatePlan } from '@/features/planner/plan-service';
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

async function seedPlayingSession(deps: ReturnType<typeof createDeps>) {
  const generated = generatePlan(IMPROVE_FORM);
  if (generated.result === undefined) {
    throw new Error('generate failed');
  }
  const session = createTestSessionFromGenerate(IMPROVE_FORM, generated.result, 'bingo-120', 1);
  await deps.driver.put('app-state', {
    ...EMPTY_PERSISTED_STATE,
    activeSessionId: session.id,
    sessions: [session],
  });
  const option = runImproveForMode(
    { formValues: IMPROVE_FORM, generated: generated.result },
    'keep-profit',
  );
  if (option === null) {
    throw new Error('improve option failed');
  }
  return { session, option, generated: generated.result };
}

describe('R2.2.5b single write improve', () => {
  it('select improve option → reload → candidate identical', async () => {
    const deps = createDeps();
    const { session, option } = await seedPlayingSession(deps);

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

    const reloaded = await deps.storage.load();
    expect(reloaded.planCandidate?.candidateId).toBe(result.candidate.candidateId);
    expect(reloaded.sessions[0]?.plans).toHaveLength(1);
  });

  it('promote candidate → reload → plan appended', async () => {
    const deps = createDeps();
    const { session, option } = await seedPlayingSession(deps);

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
    const promoted = await promote.execute();
    expect(promoted.ok).toBe(true);
    if (!promoted.ok) {
      return;
    }

    const reloaded = await deps.storage.load();
    expect(reloaded.planCandidate).toBeNull();
    expect(reloaded.sessions[0]?.plans).toHaveLength(2);
    const reloadedSession = reloaded.sessions[0];
    expect(reloadedSession).toBeDefined();
    if (reloadedSession === undefined) {
      return;
    }
    expect(getCurrentPlan(reloadedSession)?.origin).toBe('improve');
  });

  it('one domain mutation → one PersistenceService.save()', async () => {
    const deps = createDeps();
    const { session, option } = await seedPlayingSession(deps);

    const createCandidate = createImprovementCandidateUseCase({
      candidates: deps.candidates,
      sessions: deps.sessions,
      events: deps.events,
      clock: deps.clock,
    });
    await createCandidate.execute({ sessionId: session.id, option });

    const saveSpy = vi.spyOn(deps.storage, 'save');
    const promote = createPromoteCandidateToPlanUseCase({
      candidates: deps.candidates,
      sessions: deps.sessions,
      events: deps.events,
      clock: deps.clock,
    });
    const promoted = await promote.execute();
    expect(promoted.ok).toBe(true);
    expect(saveSpy).toHaveBeenCalledTimes(1);

    saveSpy.mockRestore();
  });
});
