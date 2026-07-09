import type { HTMLAttributes, ReactNode } from 'react';

import type { SpacingKey } from '@/design/tokens/spacing';
import { spacingGap } from '@/design/tokens/spacing';
import { cn } from '@/lib/utils';

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  readonly spacing?: SpacingKey;
  readonly children: ReactNode;
}

export function Stack({ spacing = 16, className, children, ...props }: StackProps): ReactNode {
  return (
    <div className={cn('flex flex-col', spacingGap[spacing], className)} {...props}>
      {children}
    </div>
  );
}
