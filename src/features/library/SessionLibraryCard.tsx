import {
  Archive,
  Copy,
  MoreVertical,
  Play,
  Star,
} from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import type { SessionCardSummary } from '@/features/library/library-types';
import { sessionStatusVisual } from '@/features/library/library-stats';
import { formatAmount } from '@/lib/money-format';
import { cn } from '@/lib/utils';

interface SessionLibraryCardProps {
  readonly summary: SessionCardSummary;
  readonly isActive: boolean;
  readonly isPinned?: boolean;
  readonly compareSelected: boolean;
  readonly onOpen: () => void;
  readonly onToggleFavorite: () => void;
  readonly onToggleArchive: () => void;
  readonly onDuplicate: () => void;
  readonly onExportJson: () => void;
  readonly onExportPrint: () => void;
  readonly onToggleCompare: () => void;
  readonly onTagAdd: (tag: string) => void;
}

export function SessionLibraryCard({
  summary,
  isActive,
  isPinned = false,
  compareSelected,
  onOpen,
  onToggleFavorite,
  onToggleArchive,
  onDuplicate,
  onExportJson,
  onExportPrint,
  onToggleCompare,
  onTagAdd,
}: SessionLibraryCardProps): ReactNode {
  const { session, presetName, stats, totalRounds, completedRounds, rewardMultiplier } = summary;
  const statusVisual = sessionStatusVisual(session.status);
  const [starPulse, setStarPulse] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    function handleClickOutside(e: MouseEvent): void {
      if (menuRef.current !== null && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key !== 'Enter') {
      return;
    }
    const value = e.currentTarget.value.trim();
    if (value !== '' && !session.tags.includes(value)) {
      onTagAdd(value);
      e.currentTarget.value = '';
    }
  }

  function handleFavoriteClick(): void {
    setStarPulse(true);
    onToggleFavorite();
    window.setTimeout(() => setStarPulse(false), 150);
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-4 transition-colors',
        isPinned && 'border-primary/50 bg-primary/5 ring-1 ring-primary/25',
        isActive && !isPinned && 'border-primary/40 ring-1 ring-primary/20',
        compareSelected && 'border-amber-500/50 bg-amber-500/5',
      )}
    >
      <div className="flex gap-3">
        <div
          className={cn(
            'flex w-16 shrink-0 flex-col items-center justify-center rounded-lg border border-border bg-muted/40 px-1 py-2 text-center',
            statusVisual.accentClass,
          )}
        >
          <span className="text-lg leading-none">{statusVisual.emoji}</span>
          <span className="mt-1 text-[9px] font-bold tracking-wide">{statusVisual.label}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
              <p className="truncate font-semibold">{session.title}</p>
            </button>
            <button
              type="button"
              onClick={handleFavoriteClick}
              aria-label="Favorite"
              className="shrink-0 rounded p-1 hover:bg-muted"
            >
              <Star
                className={cn(
                  'h-4 w-4 transition-transform duration-150',
                  starPulse && 'scale-150',
                  session.favorite && 'fill-amber-400 text-amber-500',
                )}
              />
            </button>
          </div>

          <button type="button" onClick={onOpen} className="mt-2 w-full text-left">
            <p className="text-sm font-medium">{presetName} ×{rewardMultiplier}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.roundsPlayed} vòng · Plans {stats.planCount} · Continue {stats.continueCount}{' '}
              · Cải thiện {stats.improveCount}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Max bet {formatAmount(stats.highestBet)}
            </p>
            {session.status === 'playing' || session.status === 'draft' ? (
              <p className="mt-1.5 text-sm font-medium text-primary">
                {completedRounds} / {totalRounds} vòng
              </p>
            ) : null}
            {session.profitAmount !== null && session.status === 'won' ? (
              <p className="mt-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                +{formatAmount(session.profitAmount)} đ
              </p>
            ) : null}
          </button>
        </div>
      </div>

      {session.tags.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1 pl-[4.25rem]">
          {session.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <input
        type="text"
        placeholder="+ tag"
        className="mt-2 w-full rounded border border-border bg-background px-2 py-1 text-[11px]"
        onKeyDown={handleTagKeyDown}
        onClick={(e) => e.stopPropagation()}
      />

      <div className="mt-3 flex items-center gap-1 border-t border-border pt-3">
        {(session.status === 'playing' || session.status === 'draft') && isActive ? (
          <Button size="sm" variant="default" onClick={onOpen}>
            <Play className="h-3.5 w-3.5" />
            Tiếp tục
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={onOpen}>
            Mở
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={onDuplicate} title="Nhân bản">
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="outline" onClick={onToggleArchive} title="Archive">
          <Archive className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant={compareSelected ? 'default' : 'outline'}
          onClick={onToggleCompare}
        >
          vs
        </Button>

        <div className="relative ml-auto" ref={menuRef}>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Thêm"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
          {menuOpen ? (
            <div className="absolute right-0 top-full z-10 mt-1 min-w-[9rem] rounded-lg border border-border bg-card py-1 shadow-lg">
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Export
              </p>
              <MenuItem
                label="JSON"
                onClick={() => {
                  onExportJson();
                  setMenuOpen(false);
                }}
              />
              <MenuItem
                label="PDF"
                onClick={() => {
                  onExportPrint();
                  setMenuOpen(false);
                }}
              />
              <MenuItem
                label="Print"
                onClick={() => {
                  onExportPrint();
                  setMenuOpen(false);
                }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }): ReactNode {
  return (
    <button
      type="button"
      className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted"
      onClick={onClick}
    >
      {label}
    </button>
  );
}
