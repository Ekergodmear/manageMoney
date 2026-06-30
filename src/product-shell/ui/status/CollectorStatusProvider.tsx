import { createContext, useContext, type ReactNode } from 'react';

import type { CollectorStatusSnapshot } from '@/product-shell/ui/status/status-types';

const CollectorStatusContext = createContext<CollectorStatusSnapshot | null>(null);

export interface CollectorStatusProviderProps {
  readonly value: CollectorStatusSnapshot;
  readonly children: ReactNode;
}

export function CollectorStatusProvider({ value, children }: CollectorStatusProviderProps): ReactNode {
  return <CollectorStatusContext.Provider value={value}>{children}</CollectorStatusContext.Provider>;
}

export function useCollectorStatus(): CollectorStatusSnapshot {
  const value = useContext(CollectorStatusContext);
  if (value === null) {
    throw new Error('useCollectorStatus must be used within CollectorStatusProvider');
  }
  return value;
}
