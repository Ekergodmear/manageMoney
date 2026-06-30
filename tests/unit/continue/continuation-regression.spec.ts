import { describe, expect, it } from 'vitest';

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
  roundCount: '500',
  rewardMultiplier: '20',
  minimumBet: '10.000',
  betStep: '10.000',
  userBankroll: '50.000.000',
  winTaxEnabled: false,
  winTaxThreshold: '',
  winTaxRatePercent: '',
};

function createDeps(clockDate: string) {
  const driver = new MemoryStorageDriver();
  const clock = new FakeClock(new Date(clockDate));
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

function sessionExhaustedAt500(
  generated: NonNullable<ReturnType<typeof generatePlan>['result']>,
): Session {
  const session = createTestSessionFromGenerate(CONTINUE_FORM, generated, 'bingo-120', 1);
  const planA = getCurrentPlan(session);
  if (planA === null) {
    throw new Error('missing plan A');
  }
  return {
    ...session,
    status: 'playing',
    startedAt: session.createdAt,
    plans: [
      {
        ...planA,
        status: 'playing',
        completedThroughRound: 500,
      },
    ],
  };
}

async function runContinueFrom(
  session: Session,
  deps: ReturnType<typeof createDeps>,
): Promise<Session> {
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
    targetTotalRounds: 1000,
  });
  if (!result.ok) {
    throw new Error(result.reason);
  }
  return result.session;
}

describe('S4 — Continue pipeline', () => {
  it('continuation regression: cùng SessionState → plan byte-identical', async () => {
    const generated = generatePlan(CONTINUE_FORM);
    expect(generated.result).toBeDefined();
    if (generated.result === undefined) {
      return;
    }

    const baseSession = sessionExhaustedAt500(generated.result);
    const depsA = createDeps('2026-06-25T18:00:00.000Z');
    const depsB = createDeps('2026-06-25T18:00:00.000Z');

    const sessionA = await runContinueFrom(structuredClone(baseSession), depsA);
    const sessionB = await runContinueFrom(structuredClone(baseSession), depsB);

    const planA = getCurrentPlan(sessionA);
    const planB = getCurrentPlan(sessionB);
    expect(planA).not.toBeNull();
    expect(planB).not.toBeNull();
    if (planA === null || planB === null) {
      return;
    }

    expect(JSON.stringify(planA.generated)).toBe(JSON.stringify(planB.generated));
    expect(planA.origin).toBe('continue');
    expect(planA.completedThroughRound).toBe(500);
    expect(planA.generated.strategy.rounds).toHaveLength(1000);
    expect(planA.generated.strategy.rounds[500]?.betAmount).toBeGreaterThan(0);

    const parent = sessionA.plans.find((p) => p.id === planA.parentPlanId);
    expect(parent?.status).toBe('superseded');

    const timelineEvent = sessionA.timeline.at(-1);
    expect(timelineEvent?.type).toBe('plan-added');
    expect(timelineEvent?.origin).toBe('continue');
  }, 120_000);

  it('emits PlanPromoted và ContinuationCreated', async () => {
    const generated = generatePlan({ ...CONTINUE_FORM, roundCount: '30' });
    expect(generated.result).toBeDefined();
    if (generated.result === undefined) {
      return;
    }

    const session = createTestSessionFromGenerate(CONTINUE_FORM, generated.result, 'bingo-120', 1);
    const planA = getCurrentPlan(session);
    if (planA === null) {
      return;
    }
    const playing: Session = {
      ...session,
      status: 'playing',
      plans: [{ ...planA, status: 'playing', completedThroughRound: 30 }],
    };

    const deps = createDeps('2026-06-25T18:00:00.000Z');
    let promoted = false;
    let continued = false;
    deps.events.subscribe('PlanPromoted', (event) => {
      if (event.origin === 'continue') {
        promoted = true;
      }
    });
    deps.events.subscribe('ContinuationCreated', () => {
      continued = true;
    });

    await runContinueFrom(playing, deps);
    expect(promoted).toBe(true);
    expect(continued).toBe(true);
  });

  it('reject target không lớn hơn plan hiện tại', async () => {
    const generated = generatePlan({ ...CONTINUE_FORM, roundCount: '20' });
    expect(generated.result).toBeDefined();
    if (generated.result === undefined) {
      return;
    }

    const session = createTestSessionFromGenerate(
      { ...CONTINUE_FORM, roundCount: '20' },
      generated.result,
      'bingo-120',
      1,
    );
    const deps = createDeps('2026-06-25T18:00:00.000Z');
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
      targetTotalRounds: 20,
    });
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.reason).toBe('invalid-target');
  });
});
