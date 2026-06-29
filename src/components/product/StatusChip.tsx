import type { ReactNode } from 'react';

import { statusChipTone } from '@/design/tokens/colors';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusTone = keyof typeof statusChipTone;

export interface StatusChipProps {
  readonly label: string;
  readonly tone?: StatusTone;
  readonly title?: string;
}

export function StatusChip({ label, tone = 'muted', title }: StatusChipProps): ReactNode {
  return (
    <Badge
      variant="outline"
      size="sm"
      className={cn('shrink-0', statusChipTone[tone])}
      title={title}
    >
      {label}
    </Badge>
  );
}
