import type { Session } from '@/features/session/session-domain';
import type { SessionRepository } from '@/services/storage/repositories/session-repository';
import type { PersistedAppState } from '@/features/session/session-types';

export interface SavePlayingSessionUseCaseDeps {
  readonly sessions: SessionRepository;
}

export class SavePlayingSessionUseCase {
  constructor(private readonly deps: SavePlayingSessionUseCaseDeps) {}

  async execute(session: Session): Promise<PersistedAppState> {
    return this.deps.sessions.saveSession(session);
  }
}

export function createSavePlayingSessionUseCase(
  deps: SavePlayingSessionUseCaseDeps,
): SavePlayingSessionUseCase {
  return new SavePlayingSessionUseCase(deps);
}
