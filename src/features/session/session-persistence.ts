import { getAppServices } from '@/services/registry/app-services';
import type { PersistedAppState } from '@/features/session/session-types';

/** @deprecated Import `getAppServices().storage` — kept for App.tsx during Milestone 4 rollout. */
export async function loadPersistedState(): Promise<PersistedAppState> {
  return getAppServices().storage.load();
}

/** @deprecated Import `getAppServices().storage` — kept for App.tsx during Milestone 4 rollout. */
export async function savePersistedState(state: PersistedAppState): Promise<void> {
  return getAppServices().storage.save(state);
}
