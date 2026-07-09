import { useContext } from 'react';

import { FlagsContext } from '@/services/feature-flags/FlagProvider';
import type { Flags } from '@/services/feature-flags/Flags';
import { useServices } from '@/services/registry/AppServicesProvider';

export function useFlags(): Flags {
  const override = useContext(FlagsContext);
  if (override !== null) {
    return override;
  }
  return useServices().flags;
}
