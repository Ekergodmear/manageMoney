import { describe, expect, it, vi } from 'vitest';

import { FakeClock } from '@/services/clock/fake-clock';
import { DEFAULT_PLANNER_FORM } from '@/features/planner/plan-service';
import {
  createDeletePlanningDraftUseCase,
  createGeneratePlanUseCase,
  createPromotePlanningDraftUseCase,
  createUpdatePlanningDraftUseCase,
} from '@/features/planning';
import { MemoryStorageDriver } from '@/services/storage/MemoryStorageDriver';
import { PersistenceService } from '@/services/storage/PersistenceService';
import { PlanningDraftRepository } from '@/services/storage/repositories/planning-draft-repository';
import { SessionRepository } from '@/services/storage/repositories/session-repository';
import { EventBus } from '@/services/events/domain-events';
import { EMPTY_PERSISTED_STATE } from '@/features/session/session-types';

const DRAFT_FORM = {
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

describe('R2.2 single write draft persistence', () => {
  it('case 1: generate draft → reload → draft identical', async () => {
    const deps = createDeps();
    await deps.driver.put('app-state', EMPTY_PERSISTED_STATE);

    const generate = createGeneratePlanUseCase({
      planningDrafts: deps.planningDrafts,
      events: deps.events,
      clock: deps.clock,
    });
    const result = await generate.execute({
      formValues: DRAFT_FORM,
      presetId: 'bingo-120',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const reloaded = await deps.storage.load();
    expect(reloaded.planningDraft?.draftId).toBe(result.draft.draftId);
    expect(JSON.stringify(reloaded.planningDraft?.generated)).toBe(
      JSON.stringify(result.draft.generated),
    );
  });

  it('case 2: update draft → reload → state identical', async () => {
    const deps = createDeps();
    await deps.driver.put('app-state', EMPTY_PERSISTED_STATE);

    const generate = createGeneratePlanUseCase({
      planningDrafts: deps.planningDrafts,
      events: deps.events,
      clock: deps.clock,
    });
    const generated = await generate.execute({
      formValues: DRAFT_FORM,
      presetId: 'bingo-120',
    });
    expect(generated.ok).toBe(true);
    if (!generated.ok) {
      return;
    }

    const update = createUpdatePlanningDraftUseCase({
      planningDrafts: deps.planningDrafts,
      events: deps.events,
    });
    const updated = await update.execute({
      formValues: { ...DRAFT_FORM, targetProfit: '100.000' },
    });
    expect(updated.ok).toBe(true);
    if (!updated.ok) {
      return;
    }

    const reloaded = await deps.storage.load();
    expect(reloaded).toEqual(updated.nextState);
    expect(reloaded.planningDraft?.formValues.targetProfit).toBe('100.000');
    expect(reloaded.planningDraft?.draftId).toBe(generated.draft.draftId);
  });

  it('case 3: delete draft → reload → draft removed', async () => {
    const deps = createDeps();
    await deps.driver.put('app-state', EMPTY_PERSISTED_STATE);

    const generate = createGeneratePlanUseCase({
      planningDrafts: deps.planningDrafts,
      events: deps.events,
      clock: deps.clock,
    });
    const generated = await generate.execute({
      formValues: DRAFT_FORM,
      presetId: 'bingo-120',
    });
    expect(generated.ok).toBe(true);

    const remove = createDeletePlanningDraftUseCase({ planningDrafts: deps.planningDrafts });
    const deleted = await remove.execute();
    expect(deleted.ok).toBe(true);
    if (!deleted.ok) {
      return;
    }

    const reloaded = await deps.storage.load();
    expect(reloaded).toEqual(deleted.nextState);
    expect(reloaded.planningDraft).toBeNull();
  });

  it('case 4: promote draft → repository only → one save', async () => {
    const deps = createDeps();
    await deps.driver.put('app-state', EMPTY_PERSISTED_STATE);

    const generate = createGeneratePlanUseCase({
      planningDrafts: deps.planningDrafts,
      events: deps.events,
      clock: deps.clock,
    });
    const generated = await generate.execute({
      formValues: DRAFT_FORM,
      presetId: 'bingo-120',
    });
    expect(generated.ok).toBe(true);
    if (!generated.ok) {
      return;
    }

    const saveSpy = vi.spyOn(deps.storage, 'save');
    const promote = createPromotePlanningDraftUseCase({
      planningDrafts: deps.planningDrafts,
      sessions: deps.sessions,
      events: deps.events,
      clock: deps.clock,
    });
    const promoted = await promote.execute({ startPlaying: true });
    expect(promoted.ok).toBe(true);
    expect(saveSpy).toHaveBeenCalledTimes(1);

    const reloaded = await deps.storage.load();
    expect(reloaded.planningDraft).toBeNull();
    expect(reloaded.activeSessionId).toBe(promoted.ok ? promoted.session.id : null);
    expect(reloaded.sessions[0]?.status).toBe('playing');

    saveSpy.mockRestore();
  });

  it('case 5: one domain mutation → one PersistenceService.save()', async () => {
    const deps = createDeps();
    await deps.driver.put('app-state', EMPTY_PERSISTED_STATE);

    const generate = createGeneratePlanUseCase({
      planningDrafts: deps.planningDrafts,
      events: deps.events,
      clock: deps.clock,
    });
    const saveSpy = vi.spyOn(deps.storage, 'save');

    const generated = await generate.execute({
      formValues: DRAFT_FORM,
      presetId: 'bingo-120',
    });
    expect(generated.ok).toBe(true);
    expect(saveSpy).toHaveBeenCalledTimes(1);

    saveSpy.mockClear();
    const update = createUpdatePlanningDraftUseCase({
      planningDrafts: deps.planningDrafts,
      events: deps.events,
    });
    const updated = await update.execute({
      formValues: { ...DRAFT_FORM, roundCount: '30' },
    });
    expect(updated.ok).toBe(true);
    expect(saveSpy).toHaveBeenCalledTimes(1);

    saveSpy.mockRestore();
  });
});
