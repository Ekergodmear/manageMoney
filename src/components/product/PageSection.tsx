import type { ReactNode } from 'react';

import { Stack } from '@/components/ui/Stack';
import { SectionHeader } from '@/components/product/SectionHeader';

export interface PageSectionProps {
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
}

export function PageSection({ title, description, children }: PageSectionProps): ReactNode {
  return (
    <section>
      <Stack spacing={12}>
        <SectionHeader title={title} {...(description !== undefined ? { description } : {})} />
        {children}
      </Stack>
    </section>
  );
}
