import { forwardRef, type HTMLAttributes } from 'react';

import type { SpacingKey } from '@/design/tokens/spacing';
import { spacingPadding } from '@/design/tokens/spacing';
import { cn } from '@/lib/utils';

export interface BoxProps extends HTMLAttributes<HTMLDivElement> {
  readonly padding?: SpacingKey;
}

export const Box = forwardRef<HTMLDivElement, BoxProps>(({ className, padding, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(padding !== undefined ? spacingPadding[padding] : undefined, className)}
    {...props}
  />
));
Box.displayName = 'Box';
