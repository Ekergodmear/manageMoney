import { useMemo, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { cn } from '@/lib/utils';

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
      <div className="w-full space-y-4">
        <InsightsHeader />
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Chưa đủ dữ liệu từ Session Library.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Hoàn thành 3 phiên để bắt đầu nhận insight.
            </p>
            <Button className="mt-4" size="sm" onClick={() => onNavigate('history')}>
              Mở Session Library
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <InsightsHeader updated={snapshot.updated} />

      {snapshot.reflection !== null ? (
        <ReflectionBlock reflection={snapshot.reflection} />
      ) : null}

      <InsightSection title="Quick Insights">
        <div className="space-y-3">
          {snapshot.quick.map((card) => (
            <InsightCardView
              key={card.id}
              card={card}
              onNavigate={onNavigate}
              onOpenSession={onOpenSession}
            />
          ))}
        </div>
      </InsightSection>

      {snapshot.recommendations.length > 0 ? (
        <InsightSection title="Khuyến nghị">
          <div className="space-y-3">
            {snapshot.recommendations.map((card) => (
              <InsightCardView
                key={card.id}
                card={card}
                onNavigate={onNavigate}
                onOpenSession={onOpenSession}
                emphasize
              />
            ))}
          </div>
        </InsightSection>
      ) : null}

      {snapshot.outliers.length > 0 ? (
        <InsightSection title="Outlier">
          <div className="space-y-3">
            {snapshot.outliers.map((card) => (
              <InsightCardView
                key={card.id}
                card={card}
                onNavigate={onNavigate}
                onOpenSession={onOpenSession}
              />
            ))}
          </div>
        </InsightSection>
      ) : null}

      {snapshot.trends.length > 0 ? (
        <InsightSection title="Trends">
          <div className="grid gap-3 sm:grid-cols-3">
            {snapshot.trends.map((trend) => (
              <TrendCard key={trend.id} trend={trend} />
            ))}
          </div>
        </InsightSection>
      ) : null}

      {snapshot.records.length > 0 ? (
        <InsightSection title="Records">
          <div className="grid gap-3 sm:grid-cols-2">
            {snapshot.records.map((record) => (
              <RecordCard
                key={record.id}
                record={record}
                onOpenSession={onOpenSession}
              />
            ))}
          </div>
        </InsightSection>
      ) : null}
    </div>
  );
}

function InsightsHeader({ updated }: { updated?: InsightsUpdatedMeta }): ReactNode {
  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight">Insights</h2>
      {updated !== undefined && updated.sessionCount > 0 ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Cập nhật{' '}
          <span className="font-medium text-foreground">{updated.relativeLabel}</span>
          {' · '}
          sau {updated.sessionCount} phiên
        </p>
      ) : null}
      <p className="mt-1 text-sm text-muted-foreground">
        Tôi nên làm gì tốt hơn? — đọc từ Session Library.
      </p>
    </div>
  );
}

function ReflectionBlock({ reflection }: { reflection: InsightReflection }): ReactNode {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {reflection.periodLabel}
          </p>
          <ConfidenceBadge confidence={reflection.confidence} />
        </div>
        <div className="space-y-2">
          {reflection.lines.map((line) => (
            <p key={line} className="text-sm leading-relaxed text-foreground">
              {line}
            </p>
          ))}
        </div>
        <p className="border-t border-border/60 pt-3 text-sm font-medium text-foreground">
          {reflection.closingLine}
        </p>
      </CardContent>
    </Card>
  );
}

function InsightSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): ReactNode {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function InsightCardView({
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

  return (
    <Card
      className={cn(
        emphasize && 'border-primary/20 bg-primary/5',
        card.severity === 'critical' && 'border-red-500/25',
        card.severity === 'notable' && 'border-amber-500/25',
      )}
    >
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold">
            <span className="mr-1.5">{card.emoji}</span>
            {card.title}
          </p>
          {card.confidence !== undefined ? (
            <ConfidenceBadge confidence={card.confidence} />
          ) : null}
        </div>
        <p className="text-sm leading-relaxed">{card.body}</p>
        {card.conclusion !== undefined ? (
          <p className="text-sm text-muted-foreground">{card.conclusion}</p>
        ) : null}
        {card.action !== undefined ? (
          <Button variant="outline" size="sm" className="mt-1" onClick={handleAction}>
            {card.action.label}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ConfidenceBadge({ confidence }: { confidence: InsightConfidence }): ReactNode {
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        confidence.level === 'low' && 'bg-muted text-muted-foreground',
        confidence.level === 'medium' && 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
        confidence.level === 'high' && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
        confidence.level === 'very-high' &&
          'bg-emerald-600/20 text-emerald-800 dark:text-emerald-300',
      )}
      title={`${String(confidence.sampleSize)} phiên`}
    >
      {confidence.label}
    </span>
  );
}

function TrendCard({ trend }: { trend: InsightTrend }): ReactNode {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{trend.label}</p>
        {trend.confidence !== undefined ? (
          <ConfidenceBadge confidence={trend.confidence} />
        ) : null}
      </div>
      <p className="mt-2 font-mono text-2xl tracking-widest text-primary">{trend.sparkline}</p>
      <p className="mt-2 text-xs text-foreground">{trend.summary}</p>
      <p className="mt-1 text-[11px] text-muted-foreground/80">Gần nhất: {trend.latestLabel}</p>
    </div>
  );
}

function RecordCard({
  record,
  onOpenSession,
}: {
  record: InsightRecord;
  onOpenSession: (sessionId: string) => void;
}): ReactNode {
  return (
    <button
      type="button"
      className="rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/40"
      onClick={() => {
        if (record.sessionId !== undefined) {
          onOpenSession(record.sessionId);
        }
      }}
    >
      <p className="text-sm font-medium">
        <span className="mr-1.5">{record.emoji}</span>
        {record.label}
      </p>
      <p className="mt-2 text-xl font-bold tabular-nums">{record.value}</p>
      {record.detail !== undefined ? (
        <p className="mt-1 truncate text-xs text-muted-foreground">{record.detail}</p>
      ) : null}
      {record.sessionId !== undefined ? (
        <p className="mt-2 text-[11px] font-medium text-primary">Mở Session →</p>
      ) : null}
    </button>
  );
}
