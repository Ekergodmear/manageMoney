import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Stack } from '@/components/ui/Stack';
import { Text } from '@/components/ui/Text';

export interface EmptyStateProps {
  readonly title: string;
  readonly description?: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps): ReactNode {
  return (
    <Card tone="dashed" elevation="1">
      <CardContent padding={32}>
        <Stack spacing={8} className="items-center text-center">
          <Text variant="body" muted>
            {title}
          </Text>
          {description !== undefined ? (
            <Text variant="small" muted>
              {description}
            </Text>
          ) : null}
          {actionLabel !== undefined && onAction !== undefined ? (
            <Button size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
