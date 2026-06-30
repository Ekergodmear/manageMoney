import type { ReactNode } from 'react';

import { Drawer } from '@/components/product';
import { Stack } from '@/components/ui/Stack';
import { Text } from '@/components/ui/Text';
import { semanticBorder, semanticText } from '@/design/tokens/colors';
import type { SessionCompareResult } from '@/features/library/library-types';
import { cn } from '@/lib/utils';

interface SessionComparePanelProps {
  readonly result: SessionCompareResult;
  readonly onClose: () => void;
}

export function SessionComparePanel({ result, onClose }: SessionComparePanelProps): ReactNode {
  const subtitle = `${result.leftTitle} vs ${result.rightTitle}`;

  return (
    <Drawer open title="So sánh session" subtitle={subtitle} onClose={onClose}>
      <Stack spacing={2}>
        <table className="w-full">
          <thead>
            <tr className={cn('border-b', semanticBorder.default)}>
              <th className="pb-2 text-left">
                <Text variant="small" muted>
                  Metric
                </Text>
              </th>
              <th className="pb-2 text-right">
                <Text variant="small" muted>
                  {shortTitle(result.leftTitle)}
                </Text>
              </th>
              <th className="pb-2 text-right">
                <Text variant="small" muted>
                  {shortTitle(result.rightTitle)}
                </Text>
              </th>
              <th className="pb-2 text-right">
                <Text variant="small" muted>
                  Δ
                </Text>
              </th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row) => (
              <tr key={row.id} className={cn('border-b border-border/50 last:border-0')}>
                <td className="py-2.5">
                  <Text variant="body" muted>
                    {row.label}
                  </Text>
                </td>
                <td className="py-2.5 text-right tabular-nums">
                  <Text variant="body" emphasis>
                    {row.values[0]}
                  </Text>
                </td>
                <td className="py-2.5 text-right tabular-nums">
                  <Text variant="body" emphasis>
                    {row.values[1]}
                  </Text>
                </td>
                <td className="py-2.5 text-right tabular-nums">
                  <Text
                    variant="small"
                    emphasis
                    className={cn(
                      row.delta.startsWith('+') && semanticText.success,
                      row.delta.startsWith('−') && semanticText.danger,
                      row.delta === '—' && semanticText.muted,
                    )}
                  >
                    {row.delta}
                  </Text>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Stack>
    </Drawer>
  );
}

function shortTitle(title: string): string {
  if (title.length <= 10) {
    return title;
  }
  return `${title.slice(0, 8)}…`;
}
