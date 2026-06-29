import { createContext, useContext, type ReactNode } from 'react';

import type { AppServices } from '@/services/registry/app-services';
import { getAppServices } from '@/services/registry/app-services';

const AppServicesContext = createContext<AppServices | null>(null);

export interface AppServicesProviderProps {
  readonly services?: AppServices;
  readonly children: ReactNode;
}

export function AppServicesProvider({
  services,
  children,
}: AppServicesProviderProps): ReactNode {
  const value = services ?? getAppServices();
  return (
    <AppServicesContext.Provider value={value}>{children}</AppServicesContext.Provider>
  );
}

export function useAppServices(): AppServices {
  const context = useContext(AppServicesContext);
  if (context === null) {
    throw new Error('useAppServices must be used within AppServicesProvider');
  }
  return context;
}

/** Workspace hook — prefer over getAppServices() */
export const useServices = useAppServices;

/** Optional hook — returns null outside provider (legacy paths during rollout). */
export function useAppServicesOptional(): AppServices | null {
  return useContext(AppServicesContext);
}
