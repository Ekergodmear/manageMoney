import { forwardRef, type HTMLAttributes } from 'react';

import { semanticBg, semanticBorder } from '@/design/tokens/colors';
import { motionDuration } from '@/design/tokens/motion';
import { radius } from '@/design/tokens/radius';
import type { SpacingKey } from '@/design/tokens/spacing';
import { spacingPadding } from '@/design/tokens/spacing';
import type { ShadowKey } from '@/design/tokens/shadows';
import { elevationShadow } from '@/design/tokens/shadows';
import { cn } from '@/lib/utils';

export type CardElevation = '0' | '1' | '2' | 'popup' | 'overlay';
export type CardTone = 'default' | 'highlight' | 'accent' | 'warning' | 'danger' | 'dashed';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  readonly elevation?: CardElevation;
  readonly tone?: CardTone;
}

const toneClass: Record<CardTone, string> = {
  default: cn(semanticBg.surface, semanticBorder.default),
  highlight: cn('border-primary/20 bg-gradient-to-br from-primary/5 to-transparent'),
  accent: cn('border-primary/20 bg-primary/5'),
  warning: cn(semanticBorder.warning),
  danger: cn(semanticBorder.danger),
  dashed: 'border-dashed',
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, elevation = '2', tone = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        radius.lg,
        'border text-card-foreground',
        toneClass[tone],
        elevationShadow[elevation],
        motionDuration.fast,
        'transition-colors',
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5 p-6 pb-4', className)} {...props} />
  ),
);
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-base font-semibold leading-none', className)} {...props} />
  ),
);
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  ),
);
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { readonly padding?: SpacingKey }
>(({ className, padding, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(padding !== undefined ? spacingPadding[padding] : 'p-6 pt-0', className)}
    {...props}
  />
));
CardContent.displayName = 'CardContent';

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
export type { ShadowKey };
