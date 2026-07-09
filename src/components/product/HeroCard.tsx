import type { ReactNode } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Row } from '@/components/ui/Row';
import { Stack } from '@/components/ui/Stack';
import { Text } from '@/components/ui/Text';
import { StatusChip } from '@/components/product/StatusChip';
import type { StatusTone } from '@/components/product/StatusChip';
import { Divider } from '@/components/ui/Divider';

export interface HeroCardProps {
  readonly eyebrow: string;
  readonly lines: readonly string[];
  readonly closingLine: string;
  readonly statusLabel?: string;
  readonly statusTone?: StatusTone;
}

export function HeroCard({
  eyebrow,
  lines,
  closingLine,
  statusLabel,
  statusTone,
}: HeroCardProps): ReactNode {
  return (
    <Card tone="highlight" elevation="2">
      <CardContent padding={20}>
        <Stack spacing={12}>
          <Row align="between">
            <Text variant="caption" accent>
              {eyebrow}
            </Text>
            {statusLabel !== undefined ? (
              <StatusChip label={statusLabel} tone={statusTone ?? 'muted'} />
            ) : null}
          </Row>
          <Stack spacing={8}>
            {lines.map((line) => (
              <Text key={line} variant="body">
                {line}
              </Text>
            ))}
          </Stack>
          <Divider />
          <Text variant="body" emphasis>
            {closingLine}
          </Text>
        </Stack>
      </CardContent>
    </Card>
  );
}
