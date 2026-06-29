import { useMemo, type ReactNode } from 'react';

import {
  EmptyState,
  HeroCard,
  InfoPanel,
  MetricCard,
  Page,
  PageSection,
} from '@/components/product';
import { Grid } from '@/components/ui/Grid';
import { Stack } from '@/components/ui/Stack';
import { Text } from '@/components/ui/Text';
import type { StatusTone } from '@/components/product/StatusChip';
import type { CardTone } from '@/components/ui/card';
import type { CapitalPlannerSnapshot } from '@/features/capital/capital-planner-types';
import type { GamePolicyPreset } from '@/features/game-designer/game-policy-types';
import { generateInsights } from '@/features/insights/insight-engine';
import type {
  InsightActionTarget,
  InsightCard,
  InsightConfidence,
  InsightRecord,
  InsightReflection,
  InsightsUpdatedMeta,
  InsightTrend,
} from '@/features/insights/insight-types';
import type { WorkspaceId } from '@/features/navigation/workspace-nav';
import type { Session } from '@/features/session/session-domain';

interface InsightsScreenProps {
  readonly sessions: readonly Session[];
  readonly presets: readonly GamePolicyPreset[];
  readonly capitalPlanner: CapitalPlannerSnapshot | null;
  readonly onNavigate: (workspace: WorkspaceId) => void;
  readonly onOpenSession: (sessionId: string) => void;
}

const ACTION_TARGET_WORKSPACE: Record<InsightActionTarget, WorkspaceId> = {
  scenario: 'scenario',
  capital: 'capital',
  library: 'history',
  session: 'session',
};

export function InsightsScreen({
  sessions,
  presets,
  capitalPlanner,
  onNavigate,
  onOpenSession,
}: InsightsScreenProps): ReactNode {
  const snapshot = useMemo(
    () => generateInsights({ sessions, presets, capitalPlanner }),
    [sessions, presets, capitalPlanner],
  );

  if (!snapshot.hasData) {
    return (
      <Page>
        <InsightsPageHeader />
        <EmptyState
          title="Chưa đủ dữ liệu từ Session Library."
          description="Hoàn thành 3 phiên để bắt đầu nhận insight."
          actionLabel="Mở Session Library"
          onAction={() => onNavigate('history')}
        />
      </Page>
    );
  }

  return (
    <Page>
      <InsightsPageHeader updated={snapshot.updated} />

      {snapshot.reflection !== null ? (
        <ReflectionSection reflection={snapshot.reflection} />
      ) : null}

      <PageSection title="Quick Insights">
        <Stack spacing={12}>
          {snapshot.quick.map((card) => (
            <InsightCardPanel
              key={card.id}
              card={card}
              onNavigate={onNavigate}
              onOpenSession={onOpenSession}
            />
          ))}
        </Stack>
      </PageSection>

      {snapshot.recommendations.length > 0 ? (
        <PageSection title="Khuyến nghị">
          <Stack spacing={12}>
            {snapshot.recommendations.map((card) => (
              <InsightCardPanel
                key={card.id}
                card={card}
                onNavigate={onNavigate}
                onOpenSession={onOpenSession}
                emphasize
              />
            ))}
          </Stack>
        </PageSection>
      ) : null}

      {snapshot.outliers.length > 0 ? (
        <PageSection title="Outlier">
          <Stack spacing={12}>
            {snapshot.outliers.map((card) => (
              <InsightCardPanel
                key={card.id}
                card={card}
                onNavigate={onNavigate}
                onOpenSession={onOpenSession}
              />
            ))}
          </Stack>
        </PageSection>
      ) : null}

      {snapshot.trends.length > 0 ? (
        <PageSection title="Trends">
          <TrendGrid trends={snapshot.trends} />
        </PageSection>
      ) : null}

      {snapshot.records.length > 0 ? (
        <PageSection title="Records">
          <RecordGrid records={snapshot.records} onOpenSession={onOpenSession} />
        </PageSection>
      ) : null}
    </Page>
  );
}

function InsightsPageHeader({ updated }: { updated?: InsightsUpdatedMeta }): ReactNode {
  return (
    <Stack spacing={4}>
      <Text variant="h1" as="h2">
        Insights
      </Text>
      {updated !== undefined && updated.sessionCount > 0 ? (
        <Text variant="small" muted>
          Cập nhật <Text variant="small" emphasis as="span">{updated.relativeLabel}</Text>
          {' · '}
          sau {updated.sessionCount} phiên
        </Text>
      ) : null}
      <Text variant="body" muted>
        Tôi nên làm gì tốt hơn? — đọc từ Session Library.
      </Text>
    </Stack>
  );
}

function ReflectionSection({ reflection }: { reflection: InsightReflection }): ReactNode {
  const { label, tone } = confidenceToStatus(reflection.confidence);
  return (
    <HeroCard
      eyebrow={reflection.periodLabel}
      lines={reflection.lines}
      closingLine={reflection.closingLine}
      statusLabel={label}
      statusTone={tone}
    />
  );
}

function InsightCardPanel({
  card,
  onNavigate,
  onOpenSession,
  emphasize = false,
}: {
  card: InsightCard;
  onNavigate: (workspace: WorkspaceId) => void;
  onOpenSession: (sessionId: string) => void;
  emphasize?: boolean;
}): ReactNode {
  function handleAction(): void {
    if (card.action === undefined) {
      return;
    }
    if (card.action.target === 'session' && card.action.sessionId !== undefined) {
      onOpenSession(card.action.sessionId);
      return;
    }
    onNavigate(ACTION_TARGET_WORKSPACE[card.action.target]);
  }

  const tone = insightTone(card, emphasize);
  const confidence =
    card.confidence !== undefined ? confidenceToStatus(card.confidence) : undefined;

  return (
    <InfoPanel
      emoji={card.emoji}
      title={card.title}
      body={card.body}
      {...(card.conclusion !== undefined ? { conclusion: card.conclusion } : {})}
      tone={tone}
      {...(confidence !== undefined
        ? { statusLabel: confidence.label, statusTone: confidence.tone }
        : {})}
      {...(card.action !== undefined
        ? { actionLabel: card.action.label, onAction: handleAction }
        : {})}
    />
  );
}

function TrendGrid({ trends }: { trends: readonly InsightTrend[] }): ReactNode {
  return (
    <Grid spacing={12} columns={3}>
      {trends.map((trend) => {
        const confidence =
          trend.confidence !== undefined ? confidenceToStatus(trend.confidence) : undefined;
        return (
          <MetricCard
            key={trend.id}
            label={trend.label}
            value={<Text variant="mono" accent>{trend.sparkline}</Text>}
            detail={trend.summary}
            footer={`Gần nhất: ${trend.latestLabel}`}
            {...(confidence !== undefined
              ? { statusLabel: confidence.label, statusTone: confidence.tone }
              : {})}
          />
        );
      })}
    </Grid>
  );
}

function RecordGrid({
  records,
  onOpenSession,
}: {
  records: readonly InsightRecord[];
  onOpenSession: (sessionId: string) => void;
}): ReactNode {
  return (
    <Grid spacing={12} columns={2}>
      {records.map((record) => (
        <MetricCard
          key={record.id}
          label={`${record.emoji} ${record.label}`}
          value={record.value}
          {...(record.detail !== undefined ? { detail: record.detail } : {})}
          {...(record.sessionId !== undefined
            ? {
                footer: 'Mở Session →',
                interactive: true,
                onClick: () => onOpenSession(record.sessionId as string),
              }
            : {})}
        />
      ))}
    </Grid>
  );
}

function confidenceToStatus(confidence: InsightConfidence): {
  label: string;
  tone: StatusTone;
} {
  const toneMap: Record<InsightConfidence['level'], StatusTone> = {
    low: 'muted',
    medium: 'warning',
    high: 'success',
    'very-high': 'success-strong',
  };
  return { label: confidence.label, tone: toneMap[confidence.level] };
}

function insightTone(card: InsightCard, emphasize: boolean): CardTone {
  if (emphasize) {
    return 'accent';
  }
  if (card.severity === 'critical') {
    return 'danger';
  }
  if (card.severity === 'notable') {
    return 'warning';
  }
  return 'default';
}
