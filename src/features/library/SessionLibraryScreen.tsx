import { Folder, FolderPlus, Star } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

import {
  EmptyState,
  FilterField,
  FolderTile,
  MetricCard,
  NumberFilterField,
  Page,
  PageSection,
  SearchField,
  SectionHeader,
  StatusChip,
} from '@/components/product';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Grid } from '@/components/ui/Grid';
import { Input } from '@/components/ui/input';
import { Row } from '@/components/ui/Row';
import { Stack } from '@/components/ui/Stack';
import { Text } from '@/components/ui/Text';
import { semanticText } from '@/design/tokens/colors';
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
        const second = prev[1];
        return second !== undefined ? [second, id] : [id];
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
    <Page>
      <SectionHeader
        title="Session Library"
        description="Kho kinh nghiệm chơi — tìm, so sánh, lưu trữ."
      />

      <Grid columns={4} spacing={12}>
        <MetricCard label="Active" value={String(stats.active)} />
        <MetricCard label="Completed" value={String(stats.completed)} />
        <MetricCard
          label="Won"
          value={
            <Text variant="metric" className={semanticText.success}>
              {stats.won}
            </Text>
          }
        />
        <MetricCard
          label="Lost"
          value={
            <Text variant="metric" className={semanticText.danger}>
              {stats.lost}
            </Text>
          }
        />
      </Grid>

      <Card elevation="2">
        <CardContent padding={16}>
          <Stack spacing={12}>
            <SearchField
              value={filters.query}
              placeholder="Tìm session, tag, số vòng…"
              onChange={(query) => {
                setFilters((current) => ({ ...current, query }));
              }}
            />
            <Grid columns={4} spacing={8}>
              <FilterField
                label="Trạng thái"
                value={filters.status}
                onChange={(value) => {
                  setFilters((current) => ({
                    ...current,
                    status: value as LibraryFilters['status'],
                  }));
                }}
                options={STATUS_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
              />
              <FilterField
                label="Game"
                value={filters.presetId}
                onChange={(value) => {
                  setFilters((current) => ({ ...current, presetId: value }));
                }}
                options={[
                  { value: 'all', label: 'Tất cả' },
                  ...presets.map((preset) => ({ value: preset.id, label: preset.name })),
                ]}
              />
              <FilterField
                label="Tag"
                value={filters.tag ?? 'all'}
                onChange={(value) => {
                  setFilters((current) => ({
                    ...current,
                    tag: value === 'all' ? null : value,
                  }));
                }}
                options={[
                  { value: 'all', label: 'Tất cả' },
                  ...allTags.map((tag) => ({ value: tag, label: tag })),
                ]}
              />
              <NumberFilterField
                label="Continue ≥"
                value={filters.minContinue}
                onChange={(value) => {
                  setFilters((current) => ({ ...current, minContinue: value }));
                }}
              />
            </Grid>
            <Grid columns={2} spacing={8}>
              <NumberFilterField
                label="Max bet ≥"
                value={filters.minHighestBet}
                onChange={(value) => {
                  setFilters((current) => ({ ...current, minHighestBet: value }));
                }}
              />
            </Grid>
          </Stack>
        </CardContent>
      </Card>

      <PageSection title="Collections">
        <Stack spacing={12}>
          <Row align="between">
            <Text variant="small" muted>
              Chọn folder
            </Text>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowCollectionForm((value) => !value);
              }}
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          </Row>
          <Grid columns={3} spacing={8}>
            <FolderTile
              icon={<span>📚</span>}
              name="Tất cả"
              count={sessions.filter((session) => !session.archived).length}
              active={filters.collectionId === null}
              onClick={() => {
                setFilters((current) => ({
                  ...current,
                  collectionId: null,
                  includeArchived: false,
                }));
              }}
            />
            {allCollections.map((collection) => (
              <FolderTile
                key={collection.id}
                icon={
                  collection.id === 'favorite' ? (
                    <Star className="h-5 w-5 text-warning-foreground" />
                  ) : collection.id === 'archive' ? (
                    <span>📦</span>
                  ) : (
                    <Folder className="h-5 w-5 text-muted-foreground" />
                  )
                }
                name={collection.name.replace('⭐ ', '')}
                count={countSessionsInCollection(sessions, collection.id, collections)}
                active={filters.collectionId === collection.id}
                onClick={() => {
                  setFilters((current) => ({
                    ...current,
                    collectionId: collection.id,
                    includeArchived: collection.id === 'archive',
                  }));
                }}
              />
            ))}
          </Grid>
          {showCollectionForm ? (
            <Row spacing={8}>
              <Input
                placeholder="Tên folder (tag)"
                value={newCollectionName}
                onChange={(event) => {
                  setNewCollectionName(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleAddCollection();
                  }
                }}
              />
              <Button type="button" size="sm" onClick={handleAddCollection}>
                Thêm
              </Button>
            </Row>
          ) : null}
        </Stack>
      </PageSection>

      {filters.collectionId !== 'archive' ? (
        <>
          {pinnedSession !== null ? (
            <PageSection title="Đang chơi">
              <Stack spacing={12}>
                <StatusChip label="▶ LIVE" tone="success-strong" />
                <SessionCardGrid items={[pinnedSession]} isPinned {...cardHandlers} />
              </Stack>
            </PageSection>
          ) : null}

          <PageSection title="Active">
            {otherActive.length > 0 ? (
              <SessionCardGrid items={otherActive} {...cardHandlers} />
            ) : pinnedSession === null ? (
              <EmptyState title="Không có session đang chơi." />
            ) : null}
          </PageSection>

          {recentGroups.length > 0 ? (
            <PageSection title="Recent">
              <Stack spacing={20}>
                {recentGroups.map((group) => (
                  <Stack key={group.group} spacing={12}>
                    <Text variant="caption" muted>
                      {group.label}
                    </Text>
                    <SessionCardGrid items={group.sessions} {...cardHandlers} />
                  </Stack>
                ))}
              </Stack>
            </PageSection>
          ) : (
            <PageSection title="Recent">
              <EmptyState title="Chưa có session hoàn thành." />
            </PageSection>
          )}
        </>
      ) : null}

      {(filters.collectionId === 'archive' || filters.includeArchived) && archive.length > 0 ? (
        <PageSection title="Archive">
          <SessionCardGrid items={archive.slice(0, 12)} {...cardHandlers} />
        </PageSection>
      ) : null}

      {filtered.length === 0 ? <EmptyState title="Không có session khớp bộ lọc." /> : null}

      {compareIds.length > 0 && compareIds.length < 2 ? (
        <Text variant="small" muted>
          Chọn thêm 1 session để so sánh (vs).
        </Text>
      ) : null}

      {compareResult !== null ? (
        <SessionComparePanel
          result={compareResult}
          onClose={() => {
            setCompareIds([]);
          }}
        />
      ) : null}
    </Page>
  );
}

function SessionCardGrid({
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
  readonly items: readonly Session[];
  readonly presets: readonly GamePolicyPreset[];
  readonly activeSessionId: string | null;
  readonly compareIds: readonly string[];
  readonly isPinned?: boolean;
  readonly onOpenSession: (id: string) => void;
  readonly onToggleFavorite: (id: string) => void;
  readonly onToggleArchive: (id: string) => void;
  readonly onDuplicate: (id: string) => void;
  readonly onExportJson: (id: string) => void;
  readonly onExportPrint: (id: string) => void;
  readonly onTagAdd: (id: string, tag: string) => void;
  readonly onToggleCompare: (id: string) => void;
}): ReactNode {
  return (
    <Grid columns={2} spacing={12}>
      {items.map((session) => (
        <SessionLibraryCard
          key={session.id}
          summary={buildSessionCardSummary(session, presets)}
          isActive={session.id === activeSessionId}
          isPinned={isPinned}
          compareSelected={compareIds.includes(session.id)}
          onOpen={() => {
            onOpenSession(session.id);
          }}
          onToggleFavorite={() => {
            onToggleFavorite(session.id);
          }}
          onToggleArchive={() => {
            onToggleArchive(session.id);
          }}
          onDuplicate={() => {
            onDuplicate(session.id);
          }}
          onExportJson={() => {
            onExportJson(session.id);
          }}
          onExportPrint={() => {
            onExportPrint(session.id);
          }}
          onTagAdd={(tag) => {
            onTagAdd(session.id, tag);
          }}
          onToggleCompare={() => {
            onToggleCompare(session.id);
          }}
        />
      ))}
    </Grid>
  );
}
