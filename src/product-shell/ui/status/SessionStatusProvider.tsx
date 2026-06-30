import { createContext, useContext, type ReactNode } from 'react';

import type { SessionStatusSnapshot } from '@/product-shell/ui/status/status-types';

const SessionStatusContext = createContext<SessionStatusSnapshot | null>(null);

export interface SessionStatusProviderProps {
  readonly value: SessionStatusSnapshot;
  readonly children: ReactNode;
}

export function SessionStatusProvider({ value, children }: SessionStatusProviderProps): ReactNode {
  return <SessionStatusContext.Provider value={value}>{children}</SessionStatusContext.Provider>;
}

export function useSessionStatus(): SessionStatusSnapshot {
  const value = useContext(SessionStatusContext);
  if (value === null) {
    throw new Error('useSessionStatus must be used within SessionStatusProvider');
  }
  return value;
}
