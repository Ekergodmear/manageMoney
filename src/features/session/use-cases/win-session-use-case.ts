import type { Session } from '@/features/session/session-domain';
import type { SessionRepository } from '@/services/storage/repositories/session-repository';
import type { PersistedAppState } from '@/features/session/session-types';

export interface WinSessionUseCaseDeps {
  readonly sessions: SessionRepository;
}

export class WinSessionUseCase {
  constructor(private readonly deps: WinSessionUseCaseDeps) {}

  async execute(session: Session): Promise<PersistedAppState> {
    return this.deps.sessions.saveSession(session, { clearActive: true });
  }
}

export function createWinSessionUseCase(deps: WinSessionUseCaseDeps): WinSessionUseCase {
  return new WinSessionUseCase(deps);
}
