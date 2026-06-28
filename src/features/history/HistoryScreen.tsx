import { useState, type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import type { HistorySession } from '@/features/session/session-types';
import { formatAmount } from '@/lib/money-format';
import { cn } from '@/lib/utils';

type HistoryFilter = 'all' | 'won' | 'lost' | 'cancelled';

interface HistoryScreenProps {
  readonly history: readonly HistorySession[];
  readonly onOpenSession: (id: string) => void;
}

export function HistoryScreen({ history, onOpenSession }: HistoryScreenProps): ReactNode {
  const [filter, setFilter] = useState<HistoryFilter>('all');

  const filtered = history.filter((item) => filter === 'all' || item.outcome === filter);

  const filters: { id: HistoryFilter; label: string }[] = [
    { id: 'all', label: 'Tất cả' },
    { id: 'won', label: 'Thắng' },
    { id: 'lost', label: 'Thua' },
    { id: 'cancelled', label: 'Đã hủy' },
  ];

  return (
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Session Library</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Các phiên đã chơi — bấm để xem lại.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button key={f.id} type="button" onClick={() => setFilter(f.id)}>
            <Badge
              variant={filter === f.id ? 'default' : 'outline'}
              className="cursor-pointer"
            >
              {f.label}
            </Badge>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có phiên nào trong mục này.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpenSession(item.id)}
              className={cn(
                'rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/50',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">Phiên #{String(item.sessionNumber)}</p>
                <OutcomeBadge outcome={item.outcome} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.roundCount} vòng · {item.completedRounds} đã chơi
              </p>
              {item.outcome === 'won' && item.profitAmount !== null ? (
                <p className="mt-2 text-sm font-medium text-success">
                  +{formatAmount(item.profitAmount)} đ
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Đã chi {formatAmount(item.totalSpent)} đ
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {new Date(item.finishedAt).toLocaleDateString('vi-VN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function OutcomeBadge({ outcome }: { outcome: HistorySession['outcome'] }): ReactNode {
  const map = {
    won: { label: 'Thắng', variant: 'success' as const },
    lost: { label: 'Thua', variant: 'muted' as const },
    cancelled: { label: 'Đã hủy', variant: 'outline' as const },
  };
  const item = map[outcome];
  return <Badge variant={item.variant}>{item.label}</Badge>;
}
