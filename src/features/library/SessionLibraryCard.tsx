import { Archive, Copy, Play, Star } from 'lucide-react';
import { useState, type KeyboardEvent, type ReactNode } from 'react';

import { ActionMenu } from '@/components/product';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, type CardTone } from '@/components/ui/card';
import { Divider } from '@/components/ui/Divider';
import { Input } from '@/components/ui/input';
import { Row } from '@/components/ui/Row';
import { Stack } from '@/components/ui/Stack';
import { StatusChip } from '@/components/product/StatusChip';
import { Text } from '@/components/ui/Text';
import { semanticText } from '@/design/tokens/colors';
import { motionDuration } from '@/design/tokens/motion';
import type { SessionCardSummary } from '@/features/library/library-types';
import { sessionStatusVisual } from '@/features/library/library-stats';
import { formatHitRate } from '@/features/game-data/statistics/statistics-format';
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
  const {
    session,
    stats,
    totalRounds,
    completedRounds,
    marketLabel,
    marketMultiplier,
    sessionHitExpected,
    sessionHitActual,
  } = summary;
  const statusVisual = sessionStatusVisual(session.status);
  const [starPulse, setStarPulse] = useState(false);

  const cardTone: CardTone = compareSelected
    ? 'warning'
    : isPinned
      ? 'accent'
      : isActive
        ? 'highlight'
        : 'default';

  function handleTagKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key !== 'Enter') {
      return;
    }
    const value = event.currentTarget.value.trim();
    if (value !== '' && !session.tags.includes(value)) {
      onTagAdd(value);
      event.currentTarget.value = '';
    }
  }

  function handleFavoriteClick(): void {
    setStarPulse(true);
    onToggleFavorite();
    window.setTimeout(() => {
      setStarPulse(false);
    }, 150);
  }

  return (
    <Card tone={cardTone} elevation="2">
      <CardContent padding={16}>
        <Stack spacing={12}>
          <Row spacing={12} align="start">
            <Card elevation="1" tone="default" className="w-16 shrink-0">
              <CardContent padding={8}>
                <Stack spacing={4} className="items-center text-center">
                  <Text variant="body">{statusVisual.emoji}</Text>
                  <StatusChip label={statusVisual.label} tone={statusVisual.tone} />
                </Stack>
              </CardContent>
            </Card>

            <Stack spacing={8} className="min-w-0 flex-1">
              <Row align="between" spacing={8}>
                <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
                  <Text variant="body" emphasis truncate>
                    {session.title}
                  </Text>
                </button>
                <button
                  type="button"
                  onClick={handleFavoriteClick}
                  aria-label="Favorite"
                  className={cn('shrink-0 rounded p-1 hover:bg-muted', motionDuration.fast)}
                >
                  <Star
                    className={cn(
                      'h-4 w-4 transition-transform duration-150',
                      starPulse && 'scale-150',
                      session.favorite && 'fill-warning text-warning-foreground',
                    )}
                  />
                </button>
              </Row>

              <button type="button" onClick={onOpen} className="w-full text-left">
                <Stack spacing={4}>
                  <Text variant="body" emphasis>
                    {marketLabel}
                    {marketMultiplier !== null ? ` · ×${String(marketMultiplier)}` : ''}
                  </Text>
                  <Text variant="small" muted>
                    {totalRounds} kỳ · {statusVisual.label}
                  </Text>
                  {sessionHitExpected !== null && sessionHitActual !== null ? (
                    <Text variant="small" muted>
                      Expected {formatHitRate(sessionHitExpected)} → Actual{' '}
                      {formatHitRate(sessionHitActual)}
                    </Text>
                  ) : null}
                  <Text variant="small" muted>
                    Plans {stats.planCount} · Continue {stats.continueCount} · Cải thiện{' '}
                    {stats.improveCount}
                  </Text>
                  <Text variant="small" muted>
                    Max bet {formatAmount(stats.highestBet)}
                  </Text>
                  {session.status === 'playing' || session.status === 'draft' ? (
                    <Text variant="body" accent>
                      {completedRounds} / {totalRounds} vòng
                    </Text>
                  ) : null}
                  {session.profitAmount !== null && session.status === 'won' ? (
                    <Text variant="body" emphasis className={semanticText.success}>
                      +{formatAmount(session.profitAmount)} đ
                    </Text>
                  ) : null}
                </Stack>
              </button>
            </Stack>
          </Row>

          {session.tags.length > 0 ? (
            <Row spacing={4} className="flex-wrap pl-[4.25rem]">
              {session.tags.map((tag) => (
                <Badge key={tag} variant="secondary" size="sm">
                  {tag}
                </Badge>
              ))}
            </Row>
          ) : null}

          <Input
            type="text"
            placeholder="+ tag"
            className="text-[11px]"
            onKeyDown={handleTagKeyDown}
            onClick={(event) => {
              event.stopPropagation();
            }}
          />

          <Divider />

          <Row spacing={4} align="center">
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

            <ActionMenu
              sections={[
                {
                  title: 'Export',
                  items: [
                    { label: 'JSON', onClick: onExportJson },
                    { label: 'PDF', onClick: onExportPrint },
                    { label: 'Print', onClick: onExportPrint },
                  ],
                },
              ]}
            />
          </Row>
        </Stack>
      </CardContent>
    </Card>
  );
}
