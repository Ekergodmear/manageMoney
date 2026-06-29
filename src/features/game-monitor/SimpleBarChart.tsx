import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface BarChartItem {
  readonly label: string;
  readonly value: number;
}

interface SimpleBarChartProps {
  readonly items: readonly BarChartItem[];
  readonly className?: string;
}

export function SimpleBarChart({ items, className }: SimpleBarChartProps): ReactNode {
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <div className={cn('flex items-end gap-1', className)}>
      {items.map((item) => {
        const heightPct = Math.round((item.value / max) * 100);
        return (
          <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <span className="text-[10px] tabular-nums text-muted-foreground">{item.value}</span>
            <div className="flex h-24 w-full items-end justify-center">
              <div
                className="w-full max-w-6 rounded-t bg-primary/80 transition-all"
                style={{ height: `${Math.max(heightPct, item.value > 0 ? 8 : 2)}%` }}
                title={`${item.label}: ${item.value}`}
              />
            </div>
            <span className="truncate text-[10px] font-medium">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
