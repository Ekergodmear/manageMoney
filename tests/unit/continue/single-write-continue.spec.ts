import { describe, expect, it, vi } from 'vitest';

import { createContinuePlanUseCase } from '@/features/continue/continue-plan-use-case';
import { FakeClock } from '@/services/clock/fake-clock';
import { DEFAULT_PLANNER_FORM, generatePlan } from '@/features/planner/plan-service';
import { createTestSessionFromGenerate } from '../../support/create-test-session';
import { getCurrentPlan, type Session } from '@/features/session/session-domain';
import { MemoryStorageDriver } from '@/services/storage/MemoryStorageDriver';
import { PersistenceService } from '@/services/storage/PersistenceService';
import { SessionRepository } from '@/services/storage/repositories/session-repository';
import { EventBus } from '@/services/events/domain-events';
import { EMPTY_PERSISTED_STATE } from '@/features/session/session-types';

const CONTINUE_FORM = {
  ...DEFAULT_PLANNER_FORM,
  targetProfit: '100.000',
  roundCount: '30',
  rewardMultiplier: '20',
  minimumBet: '10.000',
  betStep: '10.000',
  userBankroll: '50.000.000',
  winTaxEnabled: false,
  winTaxThreshold: '',
  winTaxRatePercent: '',
};

function createDeps() {
  const driver = new MemoryStorageDriver();
  const clock = new FakeClock(new Date('2026-06-25T18:00:00.000Z'));
  const events = new EventBus(clock);
  const storage = new PersistenceService(driver, events);
  return {
    driver,
    clock,
    events,
    storage,
    sessions: new SessionRepository(storage),
  };
}

function playingSessionAtRound30(
  generated: NonNullable<ReturnType<typeof generatePlan>['result']>,
): Session {
  const session = createTestSessionFromGenerate(CONTINUE_FORM, generated, 'bingo-120', 1);
  const planA = getCurrentPlan(session);
  if (planA === null) {
    throw new Error('missing plan');
  }
  return {
    ...session,
    status: 'playing',
    startedAt: session.createdAt,
    plans: [{ ...planA, status: 'playing', completedThroughRound: 30 }],
  };
}

describe('R2.2.3 single write continue', () => {
  it('continue → reload → state identical', async () => {
    const generated = generatePlan(CONTINUE_FORM);
    expect(generated.result).toBeDefined();
    if (generated.result === undefined) {
      return;
    }

    const deps = createDeps();
    const session = playingSessionAtRound30(generated.result);
    await deps.driver.put('app-state', {
      ...EMPTY_PERSISTED_STATE,
      activeSessionId: session.id,
      sessions: [session],
    });

    const useCase = createContinuePlanUseCase({
      sessions: deps.sessions,
      events: deps.events,
      clock: deps.clock,
    });
    const result = await useCase.execute({
      sessionId: session.id,
      targetTotalRounds: 100,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const reloaded = await deps.storage.load();
    expect(reloaded.activeSessionId).toBe(session.id);
    const saved = reloaded.sessions.find((s) => s.id === session.id);
    expect(getCurrentPlan(saved!)?.origin).toBe('continue');
    expect(getCurrentPlan(saved!)?.generated.strategy.rounds).toHaveLength(100);
  });

  it('one domain mutation → one PersistenceService.save()', async () => {
    const generated = generatePlan(CONTINUE_FORM);
    expect(generated.result).toBeDefined();
    if (generated.result === undefined) {
      return;
    }

    const deps = createDeps();
    const session = playingSessionAtRound30(generated.result);
    await deps.driver.put('app-state', {
      ...EMPTY_PERSISTED_STATE,
      activeSessionId: session.id,
      sessions: [session],
    });

    const saveSpy = vi.spyOn(deps.storage, 'save');
    const useCase = createContinuePlanUseCase({
      sessions: deps.sessions,
      events: deps.events,
      clock: deps.clock,
    });
    const result = await useCase.execute({
      sessionId: session.id,
      targetTotalRounds: 100,
    });
    expect(result.ok).toBe(true);
    expect(saveSpy).toHaveBeenCalledTimes(1);
    saveSpy.mockRestore();
  });
});
