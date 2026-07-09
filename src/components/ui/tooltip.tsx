import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { type ComponentPropsWithoutRef, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <TooltipPrimitive.Provider delayDuration={200}>{children}</TooltipPrimitive.Provider>;
}

export function Tooltip({ content, children }: { content: string; children: ReactNode }) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          className={cn(
            'z-50 max-w-xs rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground shadow-md',
          )}
          sideOffset={6}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-card" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

export function InfoTip({ content }: { content: string }) {
  return (
    <Tooltip content={content}>
      <button
        type="button"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border bg-muted text-[10px] font-bold text-muted-foreground"
        aria-label={content}
      >
        i
      </button>
    </Tooltip>
  );
}

export type TooltipContentProps = ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>;
