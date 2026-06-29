import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, type CardTone } from '@/components/ui/card';
import { Row } from '@/components/ui/Row';
import { Stack } from '@/components/ui/Stack';
import { Text } from '@/components/ui/Text';
import { StatusChip } from '@/components/product/StatusChip';
import type { StatusTone } from '@/components/product/StatusChip';

export interface InfoPanelProps {
  readonly emoji?: string;
  readonly title: string;
  readonly body: string;
  readonly conclusion?: string;
  readonly tone?: CardTone;
  readonly statusLabel?: string;
  readonly statusTone?: StatusTone;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
}

export function InfoPanel({
  emoji,
  title,
  body,
  conclusion,
  tone = 'default',
  statusLabel,
  statusTone,
  actionLabel,
  onAction,
}: InfoPanelProps): ReactNode {
  const displayTitle = emoji !== undefined ? `${emoji} ${title}` : title;

  return (
    <Card tone={tone} elevation="2">
      <CardContent padding={16}>
        <Stack spacing={8}>
          <Row align="between">
            <Text variant="h3" as="p">
              {displayTitle}
            </Text>
            {statusLabel !== undefined ? (
              <StatusChip label={statusLabel} tone={statusTone ?? 'muted'} />
            ) : null}
          </Row>
          <Text variant="body">{body}</Text>
          {conclusion !== undefined ? (
            <Text variant="body" muted>
              {conclusion}
            </Text>
          ) : null}
          {actionLabel !== undefined && onAction !== undefined ? (
            <Button variant="outline" size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
