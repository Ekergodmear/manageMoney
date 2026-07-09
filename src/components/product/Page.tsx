import type { ReactNode } from 'react';

import { Stack } from '@/components/ui/Stack';

export interface PageProps {
  readonly children: ReactNode;
}

export function Page({ children }: PageProps): ReactNode {
  return (
    <Stack spacing={32} className="w-full">
      {children}
    </Stack>
  );
}
