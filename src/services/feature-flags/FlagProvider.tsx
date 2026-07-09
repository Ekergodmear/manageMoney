import { createContext, type ReactNode } from 'react';

import type { Flags } from '@/services/feature-flags/Flags';

export const FlagsContext = createContext<Flags | null>(null);

export interface FlagProviderProps {
  readonly flags?: Flags;
  readonly children: ReactNode;
}

/**
 * Optional override for tests — production dùng flags từ AppServicesProvider.
 */
export function FlagProvider({ flags, children }: FlagProviderProps): ReactNode {
  if (flags === undefined) {
    return children;
  }
  return <FlagsContext.Provider value={flags}>{children}</FlagsContext.Provider>;
}
