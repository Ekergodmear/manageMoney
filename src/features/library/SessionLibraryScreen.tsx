import { Folder, FolderPlus, Search, Star } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createLibraryCollection } from '@/features/library/library-actions';
import { compareSessions } from '@/features/library/library-compare';
import {
  allTagsFromSessions,
  archivedSessions,
  countSessionsInCollection,
  filterLibrarySessions,
  partitionLibrarySessions,
} from '@/features/library/library-search';
import {
  buildSessionCardSummary,
  computeLibraryStats,
  groupSessionsByRecency,
  isActiveSession,
} from '@/features/library/library-stats';
import { SessionComparePanel } from '@/features/library/SessionComparePanel';
import { SessionLibraryCard } from '@/features/library/SessionLibraryCard';
import {
  BUILTIN_COLLECTIONS,
  DEFAULT_LIBRARY_FILTERS,
  type LibraryCollection,
  type LibraryFilters,
} from '@/features/library/library-types';
import type { GamePolicyPreset } from '@/features/game-designer/game-policy-types';
import type { Session } from '@/features/session/session-domain';
import { cn } from '@/lib/utils';

interface SessionLibraryScreenProps {
  readonly sessions: readonly Session[];
  readonly activeSessionId: string | null;
  readonly presets: readonly GamePolicyPreset[];
  readonly collections: readonly LibraryCollection[];
  readonly onOpenSession: (id: string) => void;
  readonly onToggleFavorite: (id: string) => void;
  readonly onToggleArchive: (id: string) => void;
  readonly onDuplicate: (id: string) => void;
  readonly onExportJson: (id: string) => void;
  readonly onExportPrint: (id: string) => void;
  readonly onTagAdd: (id: string, tag: string) => void;
  readonly onAddCollection: (collection: LibraryCollection) => void;
}

const STATUS_OPTIONS: { value: LibraryFilters['status']; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'playing', label: 'Playing' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'stopped', label: 'Stopped' },
  { value: 'draft', label: 'Draft' },
];

export function SessionLibraryScreen({
  sessions,
  activeSessionId,
  presets,
  collections,
  onOpenSession,
  onToggleFavorite,
  onToggleArchive,
  onDuplicate,
  onExportJson,
  onExportPrint,
  onTagAdd,
  onAddCollection,
}: SessionLibraryScreenProps): ReactNode {
  const [filters, setFilters] = useState<LibraryFilters>(DEFAULT_LIBRARY_FILTERS);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showCollectionForm, setShowCollectionForm] = useState(false);

  const stats = useMemo(() => computeLibraryStats(sessions), [sessions]);
  const allTags = useMemo(() => allTagsFromSessions(sessions), [sessions]);

  const filtered = useMemo(
    () => filterLibrarySessions(sessions, filters, collections),
    [sessions, filters, collections],
  );

  const { active, recent } = useMemo(() => partitionLibrarySessions(filtered), [filtered]);
  const recentGroups = useMemo(() => groupSessionsByRecency(recent), [recent]);
  const archive = useMemo(() => archivedSessions(sessions), [sessions]);

  const pinnedSession = useMemo(() => {
    if (activeSessionId === null) {
      return null;
    }
    const session = sessions.find((s) => s.id === activeSessionId);
    if (session === undefined || !isActiveSession(session) || session.archived) {
      return null;
    }
    if (!filtered.some((s) => s.id === session.id)) {
      return null;
    }
    return session;
  }, [activeSessionId, sessions, filtered]);

  const otherActive = useMemo(
    () => active.filter((s) => s.id !== pinnedSession?.id),
    [active, pinnedSession],
  );

  const compareResult = useMemo(() => {
    if (compareIds.length !== 2) {
      return null;
    }
    const left = sessions.find((s) => s.id === compareIds[0]);
    const right = sessions.find((s) => s.id === compareIds[1]);
    if (left === undefined || right === undefined) {
      return null;
    }
    return compareSessions(left, right);
  }, [compareIds, sessions]);

  function toggleCompare(id: string): void {
    setCompareIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 2) {
        return [prev[1]!, id];
      }
      return [...prev, id];
    });
  }

  function handleAddCollection(): void {
    const name = newCollectionName.trim();
    if (name === '') {
      return;
    }
    const tag = name.replace(/\s+/g, '-');
    onAddCollection(createLibraryCollection(name, tag));
    setNewCollectionName('');
    setShowCollectionForm(false);
  }

  const allCollections = [
    ...BUILTIN_COLLECTIONS,
    ...collections.map((c) => ({ id: c.id, name: c.name })),
  ];

  const cardHandlers = {
    presets,
    activeSessionId,
    compareIds,
    onOpenSession,
    onToggleFavorite,
    onToggleArchive,
    onDuplicate,
    onExportJson,
    onExportPrint,
    onTagAdd,
    onToggleCompare: toggleCompare,
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Session Library</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Kho kinh nghiệm chơi — tìm, so sánh, lưu trữ.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBox label="Active" value={stats.active} />
        <StatBox label="Completed" value={stats.completed} />
        <StatBox label="Won" value={stats.won} accent="success" />
        <StatBox label="Lost" value={stats.lost} accent="danger" />
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm session, tag, số vòng…"
            className="pl-9"
            value={filters.query}
            onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <FilterSelect
            label="Trạng thái"
            value={filters.status}
            onChange={(v) => setFilters((f) => ({ ...f, status: v as LibraryFilters['status'] }))}
            options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
          <FilterSelect
            label="Game"
            value={filters.presetId}
            onChange={(v) => setFilters((f) => ({ ...f, presetId: v }))}
            options={[
              { value: 'all', label: 'Tất cả' },
              ...presets.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
          <FilterSelect
            label="Tag"
            value={filters.tag ?? 'all'}
            onChange={(v) => setFilters((f) => ({ ...f, tag: v === 'all' ? null : v }))}
            options={[
              { value: 'all', label: 'Tất cả' },
              ...allTags.map((t) => ({ value: t, label: t })),
            ]}
          />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Continue ≥</p>
            <Input
              type="number"
              min={0}
              placeholder="—"
              value={filters.minContinue ?? ''}
              onChange={(e) => {
                const raw = e.target.value;
                setFilters((f) => ({
                  ...f,
                  minContinue: raw === '' ? null : Number(raw),
                }));
              }}
            />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Max bet ≥</p>
            <Input
              type="number"
              min={0}
              placeholder="—"
              value={filters.minHighestBet ?? ''}
              onChange={(e) => {
                const raw = e.target.value;
                setFilters((f) => ({
                  ...f,
                  minHighestBet: raw === '' ? null : Number(raw),
                }));
              }}
            />
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Collections</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowCollectionForm((v) => !v)}
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <CollectionFolder
            icon="all"
            name="Tất cả"
            count={sessions.filter((s) => !s.archived).length}
            active={filters.collectionId === null}
            onClick={() =>
              setFilters((f) => ({ ...f, collectionId: null, includeArchived: false }))
            }
          />
          {allCollections.map((c) => (
            <CollectionFolder
              key={c.id}
              icon={c.id === 'favorite' ? 'star' : c.id === 'archive' ? 'archive' : 'folder'}
              name={c.name.replace('⭐ ', '')}
              count={countSessionsInCollection(sessions, c.id, collections)}
              active={filters.collectionId === c.id}
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  collectionId: c.id,
                  includeArchived: c.id === 'archive',
                }))
              }
            />
          ))}
        </div>
        {showCollectionForm ? (
          <div className="flex gap-2">
            <Input
              placeholder="Tên folder (tag)"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddCollection();
                }
              }}
            />
            <Button type="button" size="sm" onClick={handleAddCollection}>
              Thêm
            </Button>
          </div>
        ) : null}
      </section>

      {filters.collectionId !== 'archive' ? (
        <>
          {pinnedSession !== null ? (
            <section className="space-y-3">
              <div className="flex items-center gap-2 border-b border-primary/30 pb-2">
                <span className="text-sm font-bold text-primary">▶ ĐANG CHƠI</span>
              </div>
              <CardGrid
                items={[pinnedSession]}
                isPinned
                {...cardHandlers}
              />
            </section>
          ) : null}

          {otherActive.length > 0 ? (
            <SessionSection title="Active" count={otherActive.length} empty="">
              <CardGrid items={otherActive} {...cardHandlers} />
            </SessionSection>
          ) : pinnedSession === null ? (
            <SessionSection title="Active" count={0} empty="Không có session đang chơi." />
          ) : null}

          {recentGroups.length > 0 ? (
            <section className="space-y-5">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <h3 className="text-sm font-semibold">Recent</h3>
                <span className="text-xs text-muted-foreground">{recent.length}</span>
              </div>
              {recentGroups.map((group) => (
                <div key={group.group} className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </p>
                  <div className="border-t border-border" />
                  <CardGrid items={group.sessions} {...cardHandlers} />
                </div>
              ))}
            </section>
          ) : (
            <SessionSection title="Recent" count={0} empty="Chưa có session hoàn thành." />
          )}
        </>
      ) : null}

      {(filters.collectionId === 'archive' || filters.includeArchived) && archive.length > 0 ? (
        <SessionSection title="Archive" count={archive.length} empty="Archive trống.">
          <CardGrid items={archive.slice(0, 12)} {...cardHandlers} />
        </SessionSection>
      ) : null}

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Không có session khớp bộ lọc.</p>
      ) : null}

      {compareIds.length > 0 && compareIds.length < 2 ? (
        <p className="text-xs text-muted-foreground">Chọn thêm 1 session để so sánh (vs).</p>
      ) : null}

      {compareResult !== null ? (
        <SessionComparePanel result={compareResult} onClose={() => setCompareIds([])} />
      ) : null}
    </div>
  );
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: 'success' | 'danger';
}): ReactNode {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          'text-2xl font-bold tabular-nums',
          accent === 'success' && 'text-emerald-600 dark:text-emerald-400',
          accent === 'danger' && 'text-red-600 dark:text-red-400',
        )}
      >
        {value}
      </p>
    </div>
  );
}

function CollectionFolder({
  icon,
  name,
  count,
  active,
  onClick,
}: {
  icon: 'all' | 'star' | 'archive' | 'folder';
  name: string;
  count: number;
  active: boolean;
  onClick: () => void;
}): ReactNode {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors hover:bg-muted/50',
        active ? 'border-primary bg-primary/5' : 'border-border bg-card',
      )}
    >
      <span className="text-xl leading-none">
        {icon === 'star' ? (
          <Star className="h-5 w-5 text-amber-500" />
        ) : icon === 'archive' ? (
          '📦'
        ) : icon === 'all' ? (
          '📚'
        ) : (
          <Folder className="h-5 w-5 text-muted-foreground" />
        )}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">
          {count} session{count !== 1 ? 's' : ''}
        </p>
      </div>
    </button>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}): ReactNode {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <select
        className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SessionSection({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count: number;
  empty: string;
  children?: ReactNode;
}): ReactNode {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">{count}</span>
      </div>
      {count === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : children}
    </section>
  );
}

function CardGrid({
  items,
  presets,
  activeSessionId,
  compareIds,
  isPinned = false,
  onOpenSession,
  onToggleFavorite,
  onToggleArchive,
  onDuplicate,
  onExportJson,
  onExportPrint,
  onTagAdd,
  onToggleCompare,
}: {
  items: readonly Session[];
  presets: readonly GamePolicyPreset[];
  activeSessionId: string | null;
  compareIds: readonly string[];
  isPinned?: boolean;
  onOpenSession: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onDuplicate: (id: string) => void;
  onExportJson: (id: string) => void;
  onExportPrint: (id: string) => void;
  onTagAdd: (id: string, tag: string) => void;
  onToggleCompare: (id: string) => void;
}): ReactNode {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((session) => (
        <SessionLibraryCard
          key={session.id}
          summary={buildSessionCardSummary(session, presets)}
          isActive={session.id === activeSessionId}
          isPinned={isPinned}
          compareSelected={compareIds.includes(session.id)}
          onOpen={() => onOpenSession(session.id)}
          onToggleFavorite={() => onToggleFavorite(session.id)}
          onToggleArchive={() => onToggleArchive(session.id)}
          onDuplicate={() => onDuplicate(session.id)}
          onExportJson={() => onExportJson(session.id)}
          onExportPrint={() => onExportPrint(session.id)}
          onTagAdd={(tag) => onTagAdd(session.id, tag)}
          onToggleCompare={() => onToggleCompare(session.id)}
        />
      ))}
    </div>
  );
}
