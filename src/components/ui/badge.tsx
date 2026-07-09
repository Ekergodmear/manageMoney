import { cva, type VariantProps } from 'class-variance-authority';
import { type HTMLAttributes } from 'react';

import { radius } from '@/design/tokens/radius';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  cn('inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold', radius.full),
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        primary: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-accent text-accent-foreground',
        success: 'border-transparent bg-success text-success-foreground',
        warning: 'border-transparent bg-warning text-warning-foreground',
        danger: 'border-transparent bg-destructive text-white',
        destructive: 'border-transparent bg-destructive text-white',
        muted: 'border-transparent bg-muted text-muted-foreground',
        outline: 'text-foreground',
      },
      size: {
        default: 'text-xs',
        sm: 'px-2 py-0.5 text-[10px] uppercase tracking-wide',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}
