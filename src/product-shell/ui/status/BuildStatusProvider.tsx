import { createContext, useContext, type ReactNode } from 'react';

import type { BuildStatusSnapshot } from '@/product-shell/ui/status/status-types';

const BuildStatusContext = createContext<BuildStatusSnapshot | null>(null);

export interface BuildStatusProviderProps {
  readonly value: BuildStatusSnapshot;
  readonly children: ReactNode;
}

export function BuildStatusProvider({ value, children }: BuildStatusProviderProps): ReactNode {
  return <BuildStatusContext.Provider value={value}>{children}</BuildStatusContext.Provider>;
}

export function useBuildStatus(): BuildStatusSnapshot {
  const value = useContext(BuildStatusContext);
  if (value === null) {
    throw new Error('useBuildStatus must be used within BuildStatusProvider');
  }
  return value;
}
