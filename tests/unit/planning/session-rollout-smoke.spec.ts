import { describe, expect, it } from 'vitest';

import { FakeClock } from '@/services/clock/fake-clock';
import { DEFAULT_PLANNER_FORM } from '@/features/planner/plan-service';
import { GeneratePlanUseCase } from '@/features/planning/generate-plan-use-case';
import { PromotePlanningDraftUseCase } from '@/features/planning/promote-planning-draft-use-case';
import { MemoryStorageDriver } from '@/services/storage/MemoryStorageDriver';
import { PersistenceService } from '@/services/storage/PersistenceService';
import { PlanningDraftRepository } from '@/services/storage/repositories/planning-draft-repository';
import { SessionRepository } from '@/services/storage/repositories/session-repository';
import { EventBus } from '@/services/events/domain-events';
import { EMPTY_PERSISTED_STATE } from '@/features/session/session-types';

const SMOKE_FORM = {
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
  const clock = new FakeClock(new Date('2026-06-25T12:00:00.000Z'));
  const events = new EventBus(clock);
  const storage = new PersistenceService(driver, events);
  return {
    driver,
    clock,
    events,
    storage,
    planningDrafts: new PlanningDraftRepository(storage),
    sessions: new SessionRepository(storage),
  };
}

describe('Session Rollout S1 — smoke scenarios', () => {
  it('promote path: draft cleared, session has originDraftId, SessionCreated emitted', async () => {
    const deps = createDeps();
    await deps.driver.put('app-state', EMPTY_PERSISTED_STATE);

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
      formValues: SMOKE_FORM,
      presetId: 'bingo-120',
    });
    expect(generated.ok).toBe(true);
    if (!generated.ok) {
      return;
    }

    let sessionCreated = false;
    deps.events.subscribe('SessionCreated', (event) => {
      sessionCreated = true;
      expect(event.originDraftId).toBe(generated.draft.draftId);
      expect(event.planId).toBe(generated.draft.planId);
    });

    const promoted = await promote.execute();
    expect(promoted.ok).toBe(true);
    if (!promoted.ok) {
      return;
    }

    expect(sessionCreated).toBe(true);
    expect(promoted.session.originDraftId).toBe(generated.draft.draftId);

    const state = await deps.storage.load();
    expect(state.planningDraft).toBeNull();
    expect(state.sessions).toHaveLength(1);
    expect(state.activeSessionId).toBe(promoted.session.id);
  });

  it('duplicate generate: overwrites draft, does not create sessions', async () => {
    const deps = createDeps();
    await deps.driver.put('app-state', EMPTY_PERSISTED_STATE);

    const generate = new GeneratePlanUseCase({
      planningDrafts: deps.planningDrafts,
      events: deps.events,
      clock: deps.clock,
    });

    const first = await generate.execute({
      formValues: SMOKE_FORM,
      presetId: 'bingo-120',
    });
    const second = await generate.execute({
      formValues: { ...SMOKE_FORM, targetProfit: '100.000' },
      presetId: 'bingo-120',
    });

    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) {
      return;
    }

    expect(first.draft.draftId).not.toBe(second.draft.draftId);

    const state = await deps.storage.load();
    expect(state.planningDraft?.draftId).toBe(second.draft.draftId);
    expect(state.planningDraft?.formValues.targetProfit).toBe('100.000');
    expect(state.sessions).toHaveLength(0);
    expect(state.activeSessionId).toBeNull();
  });

  it('plan regression: promoted session plan matches planning draft generated output', async () => {
    const deps = createDeps();
    await deps.driver.put('app-state', EMPTY_PERSISTED_STATE);

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
      formValues: SMOKE_FORM,
      presetId: 'bingo-120',
    });
    expect(generated.ok).toBe(true);
    if (!generated.ok) {
      return;
    }

    const promoted = await promote.execute();
    expect(promoted.ok).toBe(true);
    if (!promoted.ok) {
      return;
    }

    const plan = promoted.session.plans[0];
    expect(plan).toBeDefined();
    expect(JSON.stringify(plan?.generated)).toBe(JSON.stringify(generated.generated));
    expect(JSON.stringify(plan?.formValues)).toBe(JSON.stringify(generated.draft.formValues));
  });
});
