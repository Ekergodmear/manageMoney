import type { SessionRepository } from '@/services/storage/repositories/session-repository';
import { stopSession } from '@/features/session/session-domain';
import type { PersistedAppState } from '@/features/session/session-types';

export interface StopSessionUseCaseDeps {
  readonly sessions: SessionRepository;
}

export type StopSessionResult =
  | { readonly ok: true; readonly nextState: PersistedAppState }
  | { readonly ok: false; readonly reason: 'no-active-session' | 'session-not-found' };

export class StopSessionUseCase {
  constructor(private readonly deps: StopSessionUseCaseDeps) {}

  async execute(): Promise<StopSessionResult> {
    const state = await this.deps.sessions.loadState();
    if (state.activeSessionId === null) {
      return { ok: false, reason: 'no-active-session' };
    }
    const activeId = state.activeSessionId;
    const next = await this.deps.sessions.updateSession(activeId, (session) => stopSession(session));
    if (next === null) {
      return { ok: false, reason: 'session-not-found' };
    }
    const cleared: PersistedAppState = { ...next, activeSessionId: null };
    await this.deps.sessions.saveState(cleared);
    return { ok: true, nextState: cleared };
  }
}

export function createStopSessionUseCase(deps: StopSessionUseCaseDeps): StopSessionUseCase {
  return new StopSessionUseCase(deps);
}
