import type { HTMLAttributes, ReactNode } from 'react';

import type { SpacingKey } from '@/design/tokens/spacing';
import { spacingGap } from '@/design/tokens/spacing';
import { cn } from '@/lib/utils';

export interface RowProps extends HTMLAttributes<HTMLDivElement> {
  readonly spacing?: SpacingKey;
  readonly align?: 'start' | 'center' | 'between';
  readonly children: ReactNode;
}

const alignClass: Record<NonNullable<RowProps['align']>, string> = {
  start: 'items-start',
  center: 'items-center',
  between: 'items-center justify-between',
};

export function Row({
  spacing = 8,
  align = 'center',
  className,
  children,
  ...props
}: RowProps): ReactNode {
  return (
    <div className={cn('flex', alignClass[align], spacingGap[spacing], className)} {...props}>
      {children}
    </div>
  );
}
