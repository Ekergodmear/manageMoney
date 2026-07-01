import type { SessionRepository } from '@/services/storage/repositories/session-repository';
import { undoBetOnPlan } from '@/features/session/session-domain';
import type { PersistedAppState } from '@/features/session/session-types';

export interface UndoBetUseCaseDeps {
  readonly sessions: SessionRepository;
}

export type UndoBetResult =
  | { readonly ok: true; readonly nextState: PersistedAppState }
  | { readonly ok: false; readonly reason: 'session-not-found' | 'nothing-to-undo' };

export class UndoBetUseCase {
  constructor(private readonly deps: UndoBetUseCaseDeps) {}

  async execute(sessionId: string): Promise<UndoBetResult> {
    let undone = false;
    const next = await this.deps.sessions.updateSession(sessionId, (session) => {
      const updated = undoBetOnPlan(session);
      if (updated === null) {
        return session;
      }
      undone = true;
      return updated;
    });
    if (next === null) {
      return { ok: false, reason: 'session-not-found' };
    }
    if (!undone) {
      return { ok: false, reason: 'nothing-to-undo' };
    }
    return { ok: true, nextState: next };
  }
}

export function createUndoBetUseCase(deps: UndoBetUseCaseDeps): UndoBetUseCase {
  return new UndoBetUseCase(deps);
}
