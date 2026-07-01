import { describe, expect, it, vi } from 'vitest';

import { createLibraryCollection } from '@/features/library/library-actions';
import {
  createAddLibraryCollectionUseCase,
  createDuplicateLibrarySessionUseCase,
} from '@/features/library/use-cases';
import { createUpdateSessionUseCase } from '@/features/session/use-cases';
import { toggleSessionArchived, toggleSessionFavorite, updateSessionTags } from '@/features/library/library-actions';
import { DEFAULT_PLANNER_FORM, generatePlan } from '@/features/planner/plan-service';
import { createTestSessionFromGenerate } from '../../support/create-test-session';
import { MemoryStorageDriver } from '@/services/storage/MemoryStorageDriver';
import { PersistenceService } from '@/services/storage/PersistenceService';
import { LibraryRepository } from '@/services/storage/repositories/library-repository';
import { SessionRepository } from '@/services/storage/repositories/session-repository';
import { FakeClock } from '@/services/clock/fake-clock';
import { EventBus } from '@/services/events/domain-events';
import { EMPTY_PERSISTED_STATE } from '@/features/session/session-types';

const LIBRARY_FORM = {
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
    storage,
    sessions: new SessionRepository(storage),
    library: new LibraryRepository(storage),
  };
}

async function seedSession(deps: ReturnType<typeof createDeps>) {
  const generated = generatePlan(LIBRARY_FORM);
  if (generated.result === undefined) {
    throw new Error('failed to generate');
  }
  const session = createTestSessionFromGenerate(LIBRARY_FORM, generated.result, 'bingo-120', 1);
  await deps.driver.put('app-state', {
    ...EMPTY_PERSISTED_STATE,
    sessions: [session],
  });
  return session;
}

describe('R2.2.4 single write library', () => {
  it('favorite → reload → state identical', async () => {
    const deps = createDeps();
    const session = await seedSession(deps);
    const update = createUpdateSessionUseCase({ sessions: deps.sessions });

    const result = await update.execute(session.id, (s) => toggleSessionFavorite(s));
    expect(result).not.toBeNull();

    const reloaded = await deps.storage.load();
    expect(reloaded.sessions[0]?.favorite).toBe(true);
  });

  it('archive → reload → state identical', async () => {
    const deps = createDeps();
    const session = await seedSession(deps);
    const update = createUpdateSessionUseCase({ sessions: deps.sessions });

    await update.execute(session.id, (s) => toggleSessionArchived(s));
    const reloaded = await deps.storage.load();
    expect(reloaded.sessions[0]?.archived).toBe(true);
  });

  it('tag add → reload → state identical', async () => {
    const deps = createDeps();
    const session = await seedSession(deps);
    const update = createUpdateSessionUseCase({ sessions: deps.sessions });

    await update.execute(session.id, (s) => updateSessionTags(s, ['vip']));
    const reloaded = await deps.storage.load();
    expect(reloaded.sessions[0]?.tags).toEqual(['vip']);
  });

  it('duplicate → reload → session added', async () => {
    const deps = createDeps();
    const session = await seedSession(deps);
    const duplicate = createDuplicateLibrarySessionUseCase({ sessions: deps.sessions });

    const result = await duplicate.execute(session.id);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const reloaded = await deps.storage.load();
    expect(reloaded.sessions).toHaveLength(2);
    expect(reloaded.nextSessionNumber).toBe(2);
  });

  it('add collection → reload → collection persisted', async () => {
    const deps = createDeps();
    await deps.driver.put('app-state', EMPTY_PERSISTED_STATE);
    const add = createAddLibraryCollectionUseCase({ library: deps.library });
    const collection = createLibraryCollection('High stakes', 'high');

    const result = await add.execute(collection);
    const reloaded = await deps.storage.load();
    expect(reloaded.libraryCollections).toEqual([collection]);
    expect(reloaded).toEqual(result.nextState);
  });

  it('one domain mutation → one PersistenceService.save()', async () => {
    const deps = createDeps();
    const session = await seedSession(deps);
    const update = createUpdateSessionUseCase({ sessions: deps.sessions });
    const saveSpy = vi.spyOn(deps.storage, 'save');

    await update.execute(session.id, (s) => toggleSessionFavorite(s));
    expect(saveSpy).toHaveBeenCalledTimes(1);

    saveSpy.mockRestore();
  });
});
