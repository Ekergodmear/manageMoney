import { describe, expect, it, vi } from 'vitest';

import { applySettlementToSession } from '@/features/game-data/settlement/apply-settlement-use-case';
import {
  applyMarketToForm,
  applyPresetToForm,
  mergePresets,
} from '@/features/game-designer/preset-utils';
import { DEFAULT_PLANNER_FORM, generatePlan } from '@/features/planner/plan-service';
import { createInitialPlan } from '@/features/session/plan-factory';
import {
  getCurrentPlan,
  placeBetOnPlan,
  startCurrentPlan,
  type Session,
} from '@/features/session/session-domain';
import { EMPTY_PERSISTED_STATE } from '@/features/session/session-types';
import {
  createSavePlayingSessionUseCase,
  createStartPlanUseCase,
  createStopSessionUseCase,
  createUndoBetUseCase,
  createUpdateSessionUseCase,
  createWinSessionUseCase,
} from '@/features/session/use-cases';
import { FakeClock } from '@/services/clock/fake-clock';
import { EventBus } from '@/services/events/domain-events';
import { MemoryStorageDriver } from '@/services/storage/MemoryStorageDriver';
import { PersistenceService } from '@/services/storage/PersistenceService';
import { SessionRepository } from '@/services/storage/repositories/session-repository';

const presets = mergePresets([]);

const baseDraw = {
  drawKey: '20260629220000',
  gameId: 'bingo18',
  marketVersion: 1,
  drawAt: '2026-06-29T22:00:00+07:00',
  publishedAt: '2026-06-29T22:00:00+07:00',
  publishedEstimated: true,
  collectedAt: '2026-06-29T22:02:01+07:00',
  latencyMs: 121_000,
  source: 'bingo18',
};

function createDeps() {
  const driver = new MemoryStorageDriver();
  const clock = new FakeClock(new Date('2026-06-29T22:00:00+07:00'));
  const events = new EventBus(clock);
  const storage = new PersistenceService(driver, events);
  const sessions = new SessionRepository(storage);
  return { driver, storage, sessions };
}

function minimalPlayingSession(marketId = 'total-4'): Session {
  const preset = presets.find((p) => p.id === 'bingo-120');
  if (preset === undefined) {
    throw new Error('bingo-120 preset missing');
  }
  const formValues = applyMarketToForm(
    applyPresetToForm({ ...DEFAULT_PLANNER_FORM, userBankroll: '10.000.000' }, preset),
    preset,
    marketId,
  );
  const generated = generatePlan(formValues);
  if (generated.result === undefined) {
    throw new Error('Failed to generate plan for test session');
  }
  const plan = createInitialPlan({
    index: 0,
    origin: 'capital',
    formValues,
    generated: generated.result,
    status: 'playing',
    completedThroughRound: 0,
    createdAt: '2026-06-29T21:00:00.000Z',
  });
  return {
    id: crypto.randomUUID(),
    sessionNumber: 1,
    title: 'Session #1',
    presetId: 'bingo-120',
    status: 'playing',
    plans: [plan],
    currentPlanId: plan.id,
    timeline: [],
    notes: '',
    startedAt: '2026-06-29T21:00:00.000Z',
    profitAmount: null,
    favorite: false,
    archived: false,
    tags: [],
    lastSettledDrawKey: null,
    playedRounds: [],
    createdAt: '2026-06-29T21:00:00.000Z',
    updatedAt: '2026-06-29T21:00:00.000Z',
  };
}

function draftSessionFromPlaying(playing: Session): Session {
  const plan = getCurrentPlan(playing);
  if (plan === null) {
    throw new Error('missing plan');
  }
  return {
    ...playing,
    status: 'draft',
    startedAt: null,
    plans: [{ ...plan, status: 'ready', completedThroughRound: 0 }],
  };
}

async function seedState(
  driver: MemoryStorageDriver,
  session: Session,
  activeSessionId: string | null = session.id,
): Promise<void> {
  await driver.put('app-state', {
    ...EMPTY_PERSISTED_STATE,
    activeSessionId,
    sessions: [session],
  });
}

describe('R2.1 single write session', () => {
  it('case 1: play → win → reload → state identical', async () => {
    const deps = createDeps();
    const session = minimalPlayingSession();
    await seedState(deps.driver, session);

    const preset = presets.find((p) => p.id === 'bingo-120');
    const draw = {
      ...baseDraw,
      dice: [1, 1, 2] as const,
      total: 4,
      flower: null,
      smallLarge: 'small' as const,
    };
    const outcome = applySettlementToSession(session, draw, preset);
    expect(outcome).not.toBeNull();
    if (outcome === null) {
      return;
    }
    expect(outcome.won).toBe(true);

    const winSession = createWinSessionUseCase({ sessions: deps.sessions });
    await winSession.execute(outcome.session);
    const reloaded = await deps.storage.load();

    expect(reloaded.activeSessionId).toBeNull();
    const saved = reloaded.sessions.find((s) => s.id === session.id);
    expect(saved?.status).toBe('won');
    expect(saved?.lastSettledDrawKey).toBe(draw.drawKey);
    expect(saved?.playedRounds).toHaveLength(1);
    expect(getCurrentPlan(saved!)?.status).toBe('won');
  });

  it('case 2: undo → reload → undo persisted', async () => {
    const deps = createDeps();
    const session = minimalPlayingSession();
    await seedState(deps.driver, session);

    const updateSession = createUpdateSessionUseCase({ sessions: deps.sessions });
    const afterBet = await updateSession.execute(session.id, (s) => {
      const updated = placeBetOnPlan(s, 1);
      if (updated === null) {
        throw new Error('expected bet to apply');
      }
      return updated;
    });
    expect(afterBet).not.toBeNull();

    const undoBet = createUndoBetUseCase({ sessions: deps.sessions });
    const undone = await undoBet.execute(session.id);
    expect(undone.ok).toBe(true);
    if (!undone.ok) {
      return;
    }

    const reloaded = await deps.storage.load();
    expect(reloaded).toEqual(undone.nextState);
    expect(getCurrentPlan(reloaded.sessions[0]!)?.completedThroughRound).toBe(0);
  });

  it('case 3: stop session → reload → state identical', async () => {
    const deps = createDeps();
    const session = minimalPlayingSession();
    await seedState(deps.driver, session);

    const stopSession = createStopSessionUseCase({ sessions: deps.sessions });
    const stopped = await stopSession.execute();
    expect(stopped.ok).toBe(true);
    if (!stopped.ok) {
      return;
    }

    const reloaded = await deps.storage.load();
    expect(reloaded).toEqual(stopped.nextState);
    expect(reloaded.activeSessionId).toBeNull();
    expect(reloaded.sessions[0]?.status).toBe('stopped');
  });

  it('case 4: session workflow persists only through SessionRepository', async () => {
    const deps = createDeps();
    const draft = draftSessionFromPlaying(minimalPlayingSession());
    await seedState(deps.driver, draft);

    const saveSpy = vi.spyOn(deps.storage, 'save');
    const startPlan = createStartPlanUseCase({ sessions: deps.sessions });
    const started = await startPlan.execute(draft.id);
    expect(started.ok).toBe(true);
    expect(saveSpy).toHaveBeenCalledTimes(1);

    saveSpy.mockClear();
    const playing = started.ok ? started.nextState.sessions[0]! : draft;
    const savePlaying = createSavePlayingSessionUseCase({ sessions: deps.sessions });
    await savePlaying.execute(startCurrentPlan(playing));
    expect(saveSpy).toHaveBeenCalledTimes(1);

    saveSpy.mockRestore();
  });
});
