import type { ReactNode } from 'react';

import { Text } from '@/components/ui/Text';
import { Stack } from '@/components/ui/Stack';

export interface SectionHeaderProps {
  readonly title: string;
  readonly description?: string;
}

export function SectionHeader({ title, description }: SectionHeaderProps): ReactNode {
  return (
    <Stack spacing={4}>
      <Text variant="h3" as="h3">
        {title}
      </Text>
      {description !== undefined ? (
        <Text variant="small" muted>
          {description}
        </Text>
      ) : null}
    </Stack>
  );
}
