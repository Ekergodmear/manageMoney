import type { Session } from '@/features/session/session-domain';
import type { SessionRepository } from '@/services/storage/repositories/session-repository';
import type { PersistedAppState } from '@/features/session/session-types';

export interface UpdateSessionUseCaseDeps {
  readonly sessions: SessionRepository;
}

export class UpdateSessionUseCase {
  constructor(private readonly deps: UpdateSessionUseCaseDeps) {}

  async execute(
    sessionId: string,
    mutator: (session: Session) => Session,
  ): Promise<PersistedAppState | null> {
    return this.deps.sessions.updateSession(sessionId, mutator);
  }
}

export function createUpdateSessionUseCase(deps: UpdateSessionUseCaseDeps): UpdateSessionUseCase {
  return new UpdateSessionUseCase(deps);
}
