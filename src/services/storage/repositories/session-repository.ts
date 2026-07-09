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

export interface SaveSessionOptions {
  readonly clearActive?: boolean;
  readonly setActive?: boolean;
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

  async saveSession(
    session: Session,
    options: SaveSessionOptions = {},
  ): Promise<PersistedAppState> {
    const state = await this.loadState();
    const next: PersistedAppState = {
      ...state,
      sessions: upsertSession(state.sessions, session),
      ...(options.clearActive ? { activeSessionId: null } : {}),
      ...(options.setActive ? { activeSessionId: session.id } : {}),
    };
    await this.saveState(next);
    return next;
  }

  async updateSession(
    sessionId: string,
    mutator: (session: Session) => Session,
  ): Promise<PersistedAppState | null> {
    const state = await this.loadState();
    const target = state.sessions.find((s) => s.id === sessionId);
    if (target === undefined) {
      return null;
    }
    const updated = mutator(target);
    const next: PersistedAppState = {
      ...state,
      sessions: upsertSession(state.sessions, updated),
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

  async addDuplicatedSession(session: Session): Promise<PersistedAppState> {
    const state = await this.loadState();
    const next: PersistedAppState = {
      ...state,
      nextSessionNumber: state.nextSessionNumber + 1,
      sessions: upsertSession(state.sessions, session),
    };
    await this.saveState(next);
    return next;
  }
}
