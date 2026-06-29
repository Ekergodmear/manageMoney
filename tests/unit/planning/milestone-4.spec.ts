import { describe, expect, it, vi } from 'vitest';

import { FakeClock } from '@/services/clock/fake-clock';
import {
  DEFAULT_PLANNER_FORM,
  generatePlan,
} from '@/features/planner/plan-service';
import { GeneratePlanUseCase } from '@/features/planning/generate-plan-use-case';
import { PromotePlanningDraftUseCase } from '@/features/planning/promote-planning-draft-use-case';
import { MemoryStorageDriver } from '@/services/storage/MemoryStorageDriver';
import { PersistenceService } from '@/services/storage/PersistenceService';
import { PlanningDraftRepository } from '@/services/storage/repositories/planning-draft-repository';
import { SessionRepository } from '@/services/storage/repositories/session-repository';
import { EventBus } from '@/services/events/domain-events';
import { EMPTY_PERSISTED_STATE } from '@/features/session/session-types';
import type { LogEntry, LogSink } from '@/services/logger/sinks/log-sink';
import { Logger } from '@/services/logger/logger';

class CaptureSink implements LogSink {
  readonly entries: LogEntry[] = [];

  write(entry: LogEntry): void {
    this.entries.push(entry);
  }
}

const REGRESSION_FORM = {
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

function createPlanningDeps(driver: MemoryStorageDriver) {
  const clock = new FakeClock(new Date('2026-06-25T09:00:00.000Z'));
  const events = new EventBus(clock);
  const storage = new PersistenceService(driver, events);
  return {
    clock,
    events,
    storage,
    planningDrafts: new PlanningDraftRepository(storage),
    sessions: new SessionRepository(storage),
  };
}

describe('M4 — GeneratePlanUseCase regression', () => {
  it('generate output is byte-identical to plan-service.generatePlan', async () => {
    const direct = generatePlan(REGRESSION_FORM);
    expect(direct.result).toBeDefined();

    const driver = new MemoryStorageDriver();
    await driver.put('app-state', EMPTY_PERSISTED_STATE);
    const deps = createPlanningDeps(driver);
    const useCase = new GeneratePlanUseCase({
      planningDrafts: deps.planningDrafts,
      events: deps.events,
      clock: deps.clock,
    });

    const result = await useCase.execute({
      formValues: REGRESSION_FORM,
      presetId: 'bingo-120',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(JSON.stringify(result.generated)).toBe(JSON.stringify(direct.result));
  });

  it('does not create Session aggregate — only planningDraft', async () => {
    const driver = new MemoryStorageDriver();
    await driver.put('app-state', {
      ...EMPTY_PERSISTED_STATE,
      nextSessionNumber: 7,
      activeSessionId: 'existing',
    });
    const deps = createPlanningDeps(driver);
    const useCase = new GeneratePlanUseCase({
      planningDrafts: deps.planningDrafts,
      events: deps.events,
      clock: deps.clock,
    });

    const result = await useCase.execute({
      formValues: REGRESSION_FORM,
      presetId: 'bingo-120',
    });
    expect(result.ok).toBe(true);

    const state = await deps.storage.load();
    expect(state.sessions).toHaveLength(0);
    expect(state.activeSessionId).toBe('existing');
    expect(state.nextSessionNumber).toBe(7);
    expect(state.planningDraft).not.toBeNull();
    expect(state.planningDraft?.draftId).toBeDefined();
  });
});

describe('M4 DoD — end-to-end operational path', () => {
  it('execute → persistence → PlanGenerated → telemetry → logger', async () => {
    const driver = new MemoryStorageDriver();
    await driver.put('app-state', EMPTY_PERSISTED_STATE);
    const clock = new FakeClock(new Date('2026-06-25T10:00:00.000Z'));
    const events = new EventBus(clock);
    const storage = new PersistenceService(driver, events);
    const sink = new CaptureSink();
    const logger = new Logger(events, [sink]);
    const { TelemetryStore } = await import('@/services/telemetry/telemetry-store');
    const { EventStore } = await import('@/services/telemetry/event-store');
    const telemetry = new TelemetryStore(new EventStore(driver), events, { enabled: true });
    const useCase = new GeneratePlanUseCase({
      planningDrafts: new PlanningDraftRepository(storage),
      events,
      clock,
    });

    const result = await useCase.execute({
      formValues: REGRESSION_FORM,
      presetId: 'bingo-120',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 0));

    const log = await telemetry.readAll();
    const planEvent = log.find((e) => e.type === 'PlanGenerated');
    expect(planEvent).toBeDefined();
    expect(planEvent?.payload).toMatchObject({
      sessionId: result.draft.draftId,
      planId: result.draft.planId,
    });
    expect(planEvent?.schemaVersion).toBe(1);
    expect(planEvent?.occurredAt).toBe('2026-06-25T10:00:00.000Z');

    expect(sink.entries.some((e) => e.event.type === 'PlanGenerated')).toBe(true);
    expect(sink.entries.some((e) => e.event.type === 'PlanningDraftSaved')).toBe(true);

    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const { ConsoleSink } = await import('@/services/logger/sinks/console-sink');
    new ConsoleSink().write({
      level: 'info',
      message: 'PlanGenerated',
      event: events.createEvent('PlanGenerated', {
        sessionId: result.draft.draftId,
        planId: result.draft.planId,
      }),
    });
    expect(consoleSpy).toHaveBeenCalledWith(
      `[Planning] PlanGenerated session=${result.draft.draftId} plan=${result.draft.planId}`,
    );
    consoleSpy.mockRestore();

    telemetry.dispose();
    logger.dispose();
  });
});

describe('S1 — PromotePlanningDraftUseCase', () => {
  it('promotes draft to session, clears draft, emits SessionCreated', async () => {
    const driver = new MemoryStorageDriver();
    await driver.put('app-state', EMPTY_PERSISTED_STATE);
    const deps = createPlanningDeps(driver);
    const generate = new GeneratePlanUseCase({
      planningDrafts: deps.planningDrafts,
      events: deps.events,
      clock: deps.clock,
    });
    const promote = new PromotePlanningDraftUseCase({
      planningDrafts: deps.planningDrafts,
      sessions: deps.sessions,
      events: deps.events,
      clock: deps.clock,
    });

    const generated = await generate.execute({
      formValues: REGRESSION_FORM,
      presetId: 'bingo-120',
    });
    expect(generated.ok).toBe(true);
    if (!generated.ok) {
      return;
    }

    const emitted: string[] = [];
    const unsub = deps.events.subscribe('SessionCreated', (e) => {
      emitted.push(e.type);
    });

    const result = await promote.execute();
    unsub();

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.session.originDraftId).toBe(generated.draft.draftId);
    expect(result.session.plans).toHaveLength(1);
    expect(result.session.plans[0]?.id).toBe(generated.draft.planId);
    expect(result.nextState.planningDraft).toBeNull();
    expect(result.nextState.sessions).toHaveLength(1);
    expect(result.nextState.nextSessionNumber).toBe(2);
    expect(emitted).toContain('SessionCreated');

    const state = await deps.storage.load();
    expect(state.planningDraft).toBeNull();
    expect(state.sessions).toHaveLength(1);
  });

  it('returns no-draft when planning draft is missing', async () => {
    const driver = new MemoryStorageDriver();
    await driver.put('app-state', EMPTY_PERSISTED_STATE);
    const deps = createPlanningDeps(driver);
    const promote = new PromotePlanningDraftUseCase({
      planningDrafts: deps.planningDrafts,
      sessions: deps.sessions,
      events: deps.events,
      clock: deps.clock,
    });

    const result = await promote.execute();
    expect(result).toEqual({ ok: false, reason: 'no-draft' });
  });
});
