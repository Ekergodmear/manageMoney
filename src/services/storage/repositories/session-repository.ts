import type { Session } from '@/features/session/session-domain';
import type { PersistedAppState } from '@/features/session/session-types';
import type { PersistenceService } from '@/services/storage/PersistenceService';

function upsertSession(sessions: readonly Session[], session: Session): Session[] {
  const index = sessions.findIndex((s) => s.id === session.id);
  if (index < 0) {
    return [session, ...sessions];
  }
  return sessions.map((s, i) => (i === index ? session : s));
}

export class SessionRepository {
  constructor(private readonly storage: PersistenceService) {}

  async loadState(): Promise<PersistedAppState> {
    return this.storage.load();
  }

  async saveState(state: PersistedAppState): Promise<void> {
    return this.storage.save(state);
  }

  async upsert(session: Session): Promise<PersistedAppState> {
    const state = await this.loadState();
    const next: PersistedAppState = {
      ...state,
      sessions: upsertSession(state.sessions, session),
    };
    await this.saveState(next);
    return next;
  }

  async promoteActive(sessionId: string, nextSessionNumber: number): Promise<PersistedAppState> {
    const state = await this.loadState();
    const next: PersistedAppState = {
      ...state,
      activeSessionId: sessionId,
      nextSessionNumber,
    };
    await this.saveState(next);
    return next;
  }
}
