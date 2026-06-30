import { createContext, useContext, type ReactNode } from 'react';

import type { CloudStatusSnapshot } from '@/product-shell/ui/status/status-types';

const CloudStatusContext = createContext<CloudStatusSnapshot | null>(null);

export interface CloudStatusProviderProps {
  readonly value: CloudStatusSnapshot;
  readonly children: ReactNode;
}

export function CloudStatusProvider({ value, children }: CloudStatusProviderProps): ReactNode {
  return <CloudStatusContext.Provider value={value}>{children}</CloudStatusContext.Provider>;
}

export function useCloudStatus(): CloudStatusSnapshot {
  const value = useContext(CloudStatusContext);
  if (value === null) {
    throw new Error('useCloudStatus must be used within CloudStatusProvider');
  }
  return value;
}
