import { duplicateSession } from '@/features/library/library-actions';
import type { Session } from '@/features/session/session-domain';
import type { PersistedAppState } from '@/features/session/session-types';
import type { SessionRepository } from '@/services/storage/repositories/session-repository';

export interface DuplicateLibrarySessionUseCaseDeps {
  readonly sessions: SessionRepository;
}

export type DuplicateLibrarySessionSuccess = {
  readonly ok: true;
  readonly session: Session;
  readonly nextState: PersistedAppState;
};

export type DuplicateLibrarySessionFailure = {
  readonly ok: false;
  readonly reason: 'session-not-found';
};

export type DuplicateLibrarySessionResult =
  | DuplicateLibrarySessionSuccess
  | DuplicateLibrarySessionFailure;

export class DuplicateLibrarySessionUseCase {
  constructor(private readonly deps: DuplicateLibrarySessionUseCaseDeps) {}

  async execute(sessionId: string): Promise<DuplicateLibrarySessionResult> {
    const state = await this.deps.sessions.loadState();
    const source = state.sessions.find((s) => s.id === sessionId);
    if (source === undefined) {
      return { ok: false, reason: 'session-not-found' };
    }

    const copy = duplicateSession(source, state.nextSessionNumber, state.sessions);
    const nextState = await this.deps.sessions.addDuplicatedSession(copy);
    return { ok: true, session: copy, nextState };
  }
}

export function createDuplicateLibrarySessionUseCase(
  deps: DuplicateLibrarySessionUseCaseDeps,
): DuplicateLibrarySessionUseCase {
  return new DuplicateLibrarySessionUseCase(deps);
}
