import type { HTMLAttributes, ReactNode } from 'react';

import type { SpacingKey } from '@/design/tokens/spacing';
import { spacingGap } from '@/design/tokens/spacing';
import { cn } from '@/lib/utils';

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  readonly spacing?: SpacingKey;
  readonly columns?: 1 | 2 | 3 | 4;
  readonly children: ReactNode;
}

const columnClass: Record<NonNullable<GridProps['columns']>, string> = {
  1: 'grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
};

export function Grid({
  spacing = 12,
  columns = 1,
  className,
  children,
  ...props
}: GridProps): ReactNode {
  return (
    <div
      className={cn('grid grid-cols-1', columnClass[columns], spacingGap[spacing], className)}
      {...props}
    >
      {children}
    </div>
  );
}
