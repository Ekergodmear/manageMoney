import type { SessionRepository } from '@/services/storage/repositories/session-repository';
import { startCurrentPlan } from '@/features/session/session-domain';
import type { PersistedAppState } from '@/features/session/session-types';

export interface StartPlanUseCaseDeps {
  readonly sessions: SessionRepository;
}

export type StartPlanResult =
  | { readonly ok: true; readonly nextState: PersistedAppState }
  | { readonly ok: false; readonly reason: 'session-not-found' };

export class StartPlanUseCase {
  constructor(private readonly deps: StartPlanUseCaseDeps) {}

  async execute(activeSessionId: string): Promise<StartPlanResult> {
    const next = await this.deps.sessions.updateSession(activeSessionId, (session) =>
      startCurrentPlan(session),
    );
    if (next === null) {
      return { ok: false, reason: 'session-not-found' };
    }
    return { ok: true, nextState: next };
  }
}

export function createStartPlanUseCase(deps: StartPlanUseCaseDeps): StartPlanUseCase {
  return new StartPlanUseCase(deps);
}
