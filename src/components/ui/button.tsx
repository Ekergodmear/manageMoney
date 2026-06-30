import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { type ButtonHTMLAttributes, forwardRef } from 'react';

import { radius } from '@/design/tokens/radius';
import { motionDuration } from '@/design/tokens/motion';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold',
    motionDuration.fast,
    'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  ),
  {
    variants: {
      variant: {
        primary: 'bg-foreground text-background hover:bg-foreground/90',
        default: 'bg-foreground text-background hover:bg-foreground/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border border-border bg-card hover:bg-muted',
        ghost: 'hover:bg-muted',
        link: 'text-primary underline-offset-4 hover:underline',
        destructive: 'bg-destructive text-white hover:bg-destructive/90',
      },
      size: {
        default: 'h-11 px-5 py-2',
        sm: 'h-9 px-3',
        lg: 'h-12 px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const sizeRadius: Record<NonNullable<VariantProps<typeof buttonVariants>['size']>, string> = {
  default: radius.md,
  sm: radius.sm,
  lg: radius.md,
  icon: radius.md,
};

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), sizeRadius[size ?? 'default'], className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
