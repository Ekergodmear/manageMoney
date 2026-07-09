import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  migratePersistedState,
  migratePersistedStateIdempotent,
  PERSISTED_STATE_VERSION,
  runPersistedStateMigration,
} from '@/services/storage/migrations';
import { MemoryStorageDriver } from '@/services/storage/MemoryStorageDriver';
import { PersistenceService } from '@/services/storage/PersistenceService';
import { APP_STATE_STORAGE_KEY } from '@/services/storage/repositories/app-state-repository';
import { LibraryRepository } from '@/services/storage/repositories/library-repository';
import { PlanCandidateRepository } from '@/services/storage/repositories/plan-candidate-repository';
import { PlanningDraftRepository } from '@/services/storage/repositories/planning-draft-repository';
import { RecommendationSetRepository } from '@/services/storage/repositories/recommendation-set-repository';
import { SessionRepository } from '@/services/storage/repositories/session-repository';

const FIXTURE_DIR = join(process.cwd(), 'tests', 'fixtures', 'persistence');

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, name), 'utf8')) as unknown;
}

describe('R2.3 — Migration Evidence', () => {
  describe('Case 1: v5 → migrate → v6 parity', () => {
    it('preserves identical business state', () => {
      const v5 = loadFixture('persisted-v5.json');
      const expected = loadFixture('persisted-v6.expected.json');
      const { state, migratedFrom } = runPersistedStateMigration(v5);

      expect(migratedFrom).toBe(5);
      expect(state.version).toBe(PERSISTED_STATE_VERSION);
      expect(state).toEqual(expected);
    });
  });

  describe('Case 2: unknown optional field preserved', () => {
    it('keeps unrecognized fields through migration', () => {
      const raw = loadFixture('persisted-v5-unknown-field.json') as Record<string, unknown>;
      const migrated = migratePersistedState(raw);

      expect(migrated.version).toBe(PERSISTED_STATE_VERSION);
      expect(
        (migrated as unknown as Record<string, unknown>)['_maintainerExperimentalField'],
      ).toBe('preserve-me');
    });
  });

  describe('Case 3: old snapshot → repositories load', () => {
    it('upgrades legacy v2 and lets repositories read migrated state', async () => {
      const driver = new MemoryStorageDriver();
      await driver.put(APP_STATE_STORAGE_KEY, loadFixture('persisted-v2.json'));
      const storage = new PersistenceService(driver);

      const sessions = new SessionRepository(storage);
      const drafts = new PlanningDraftRepository(storage);
      const library = new LibraryRepository(storage);
      const candidates = new PlanCandidateRepository(storage);
      const recommendations = new RecommendationSetRepository(storage);

      const sessionState = await sessions.loadState();
      const draftState = await drafts.loadState();
      const libraryState = await library.loadState();
      const candidateState = await candidates.loadState();
      const recommendationState = await recommendations.loadState();

      expect(sessionState.version).toBe(PERSISTED_STATE_VERSION);
      expect(draftState.version).toBe(PERSISTED_STATE_VERSION);
      expect(libraryState.version).toBe(PERSISTED_STATE_VERSION);
      expect(candidateState.version).toBe(PERSISTED_STATE_VERSION);
      expect(recommendationState.version).toBe(PERSISTED_STATE_VERSION);

      expect(await drafts.get()).toBeNull();
      expect(await candidates.get()).toBeNull();
      expect(await recommendations.get()).toBeNull();
      expect(sessionState.sessions).toEqual([]);
      expect(libraryState.libraryCollections).toEqual([]);
      expect(sessionState.nextSessionNumber).toBe(3);
    });

    it('upgrades rich v5 snapshot for repository accessors', async () => {
      const driver = new MemoryStorageDriver();
      await driver.put(APP_STATE_STORAGE_KEY, loadFixture('persisted-v5.json'));
      const storage = new PersistenceService(driver);

      const sessions = new SessionRepository(storage);
      const drafts = new PlanningDraftRepository(storage);
      const library = new LibraryRepository(storage);

      const state = await sessions.loadState();
      expect(state.sessions).toHaveLength(1);
      expect(state.sessions[0]?.id).toBe('sess-fixture-001');
      expect(state.sessions[0]?.plans[0]?.marketId).toBe('total-4');

      const draft = await drafts.get();
      expect(draft?.draftId).toBe('draft-001');

      const libraryState = await library.loadState();
      expect(libraryState.libraryCollections).toHaveLength(1);
      expect(libraryState.capitalPlanner?.marketId).toBe('total-4');
    });
  });

  describe('Case 4: idempotent migration', () => {
    it('produces the same result when run twice', () => {
      const v5 = loadFixture('persisted-v5.json');
      const once = migratePersistedState(v5);
      const twice = migratePersistedStateIdempotent(v5);

      expect(twice).toEqual(once);
      expect(migratePersistedState(once)).toEqual(once);
    });

    it('does not report migration when source is already current', () => {
      const v6 = migratePersistedState(loadFixture('persisted-v5.json'));
      const { migratedFrom } = runPersistedStateMigration(v6);

      expect(migratedFrom).toBeNull();
    });
  });

  describe('Regression matrix: legacy versions → current', () => {
    it.each([
      ['persisted-v2.json', 2],
      ['persisted-v5.json', 5],
    ] as const)('migrates %s forward-only to v%s', (fixture, fromVersion) => {
      const raw = loadFixture(fixture);
      const { state, migratedFrom } = runPersistedStateMigration(raw);

      expect(migratedFrom).toBe(fromVersion);
      expect(state.version).toBe(PERSISTED_STATE_VERSION);
    });

    it('migrates v2 active/history shape with stable plan ids when UUID is fixed', () => {
      const uuid = vi
        .spyOn(crypto, 'randomUUID')
        .mockReturnValue('00000000-0000-4000-8000-000000000001');

      const v2 = {
        version: 2,
        theme: 'light',
        nextSessionNumber: 1,
        activePresetId: 'bingo-120',
        customGamePresets: [],
        activeSession: {
          id: 'active-legacy-001',
          sessionNumber: 1,
          status: 'ready',
          formValues: {
            targetProfit: '100.000',
            roundCount: '5',
            rewardMultiplier: '20',
            minimumBet: '10.000',
            maximumBet: '1.000.000',
            betStep: '10.000',
            userBankroll: '30.000.000',
            winTaxEnabled: true,
            winTaxThreshold: '10.000.000',
            winTaxRatePercent: '10',
          },
          generated: (
            loadFixture('persisted-v5.json') as { planningDraft: { generated: unknown } }
          ).planningDraft.generated,
          completedThroughRound: 0,
          timeline: [],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        history: [],
      };

      const migrated = migratePersistedState(v2);
      uuid.mockRestore();

      expect(migrated.version).toBe(PERSISTED_STATE_VERSION);
      expect(migrated.sessions).toHaveLength(1);
      expect(migrated.sessions[0]?.id).toBe('active-legacy-001');
      expect(migrated.sessions[0]?.plans[0]?.id).toBe('00000000-0000-4000-8000-000000000001');
      expect(migrated.activeSessionId).toBe('active-legacy-001');
    });
  });
});
