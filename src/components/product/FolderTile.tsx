import type { ReactNode } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Row } from '@/components/ui/Row';
import { Stack } from '@/components/ui/Stack';
import { Text } from '@/components/ui/Text';
import { motionDuration } from '@/design/tokens/motion';
import { radius } from '@/design/tokens/radius';
import { cn } from '@/lib/utils';

export interface FolderTileProps {
  readonly icon: ReactNode;
  readonly name: string;
  readonly count: number;
  readonly active?: boolean;
  readonly onClick: () => void;
}

export function FolderTile({
  icon,
  name,
  count,
  active = false,
  onClick,
}: FolderTileProps): ReactNode {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left',
        radius.lg,
        motionDuration.fast,
        'transition-opacity hover:opacity-90',
      )}
    >
      <Card tone={active ? 'accent' : 'default'} elevation="2">
        <CardContent padding={16}>
          <Row spacing={12} align="start">
            <span className="shrink-0 leading-none">{icon}</span>
            <Stack spacing={4} className="min-w-0">
              <Text variant="body" emphasis truncate>
                {name}
              </Text>
              <Text variant="small" muted>
                {count} session{count !== 1 ? 's' : ''}
              </Text>
            </Stack>
          </Row>
        </CardContent>
      </Card>
    </button>
  );
}
