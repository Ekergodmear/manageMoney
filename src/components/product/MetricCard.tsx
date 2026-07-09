import type { ReactNode } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { radius } from '@/design/tokens/radius';
import { motionDuration } from '@/design/tokens/motion';
import { Row } from '@/components/ui/Row';
import { Stack } from '@/components/ui/Stack';
import { Text } from '@/components/ui/Text';
import { StatusChip } from '@/components/product/StatusChip';
import type { StatusTone } from '@/components/product/StatusChip';
import { cn } from '@/lib/utils';

export interface MetricCardProps {
  readonly label: string;
  readonly value: ReactNode;
  readonly detail?: string;
  readonly footer?: string;
  readonly statusLabel?: string;
  readonly statusTone?: StatusTone;
  readonly interactive?: boolean;
  readonly onClick?: () => void;
}

export function MetricCard({
  label,
  value,
  detail,
  footer,
  statusLabel,
  statusTone,
  interactive = false,
  onClick,
}: MetricCardProps): ReactNode {
  const content = (
    <Card elevation="2" tone="default">
      <CardContent padding={16}>
        <Stack spacing={8}>
          <Row align="between">
            <Text variant="small" muted>
              {label}
            </Text>
            {statusLabel !== undefined ? (
              <StatusChip label={statusLabel} tone={statusTone ?? 'muted'} />
            ) : null}
          </Row>
          {typeof value === 'string' ? <Text variant="metric">{value}</Text> : value}
          {detail !== undefined ? (
            <Text variant="small" muted truncate>
              {detail}
            </Text>
          ) : null}
          {footer !== undefined ? (
            <Text variant="small" accent emphasis>
              {footer}
            </Text>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );

  if (interactive && onClick !== undefined) {
    return (
      <button
        type="button"
        className={cn(
          'w-full text-left',
          radius.lg,
          motionDuration.fast,
          'transition-opacity hover:opacity-90',
        )}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return content;
}
