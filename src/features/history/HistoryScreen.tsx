import { useMemo, useState, type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import type { Session } from '@/features/session/session-domain';
import { computeSessionStatistics } from '@/features/session/session-domain';
import { formatAmount } from '@/lib/money-format';
import { cn } from '@/lib/utils';

type LibraryFilter = 'all' | 'playing' | 'won' | 'lost' | 'stopped';

interface SessionLibraryScreenProps {
  readonly sessions: readonly Session[];
  readonly activeSessionId: string | null;
  readonly onOpenSession: (id: string) => void;
}

export function SessionLibraryScreen({
  sessions,
  activeSessionId,
  onOpenSession,
}: SessionLibraryScreenProps): ReactNode {
  const [filter, setFilter] = useState<LibraryFilter>('all');

  const filtered = useMemo(() => {
    const list = sessions.filter((s) => filter === 'all' || s.status === filter);
    return [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [sessions, filter]);

  const filters: { id: LibraryFilter; label: string }[] = [
    { id: 'all', label: 'Tất cả' },
    { id: 'playing', label: 'Playing' },
    { id: 'won', label: 'Won' },
    { id: 'lost', label: 'Lost' },
    { id: 'stopped', label: 'Stopped' },
  ];

  return (
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Session Library</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Mở session — không mở plan riêng lẻ.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button key={f.id} type="button" onClick={() => setFilter(f.id)}>
            <Badge variant={filter === f.id ? 'default' : 'outline'} className="cursor-pointer">
              {f.label}
            </Badge>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có session trong mục này.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((session) => {
            const stats = computeSessionStatistics(session);
            const isActive = session.id === activeSessionId;
            return (
              <button
                key={session.id}
                type="button"
                onClick={() => onOpenSession(session.id)}
                className={cn(
                  'rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/50',
                  isActive && 'border-primary/40',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{session.title}</p>
                  <Badge variant={session.status === 'won' ? 'success' : 'outline'}>
                    {session.status}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stats.planCount} plans · {stats.roundsPlayed} vòng
                </p>
                {session.profitAmount !== null && session.status === 'won' ? (
                  <p className="mt-2 text-sm font-medium text-success">
                    +{formatAmount(session.profitAmount)} đ
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Capital {formatAmount(stats.totalCapital)} đ
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(session.updatedAt).toLocaleDateString('vi-VN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Re-export under old name for gradual migration
export { SessionLibraryScreen as HistoryScreen };
