import type { InsightConfidence, InsightsUpdatedMeta, SessionInsightMetrics } from '@/features/insights/insight-types';

export type { InsightsUpdatedMeta };

export type ConfidenceLevel = InsightConfidence['level'];

const MAX_REFLECTION_SESSIONS = 12;
const DAY_MS = 86_400_000;

export function confidenceFromSampleSize(sampleSize: number): InsightConfidence {
  if (sampleSize < 5) {
    return { level: 'low', label: 'Low', sampleSize };
  }
  if (sampleSize < 20) {
    return { level: 'medium', label: 'Medium', sampleSize };
  }
  if (sampleSize <= 100) {
    return { level: 'high', label: 'High', sampleSize };
  }
  return { level: 'very-high', label: 'Very High', sampleSize };
}

export function buildInsightsUpdatedMeta(
  metrics: readonly SessionInsightMetrics[],
): InsightsUpdatedMeta {
  if (metrics.length === 0) {
    return { relativeLabel: '—', sessionCount: 0 };
  }
  const latest = [...metrics].sort((a, b) =>
    b.session.updatedAt.localeCompare(a.session.updatedAt),
  )[0]!;
  return {
    relativeLabel: formatRelativeUpdated(latest.session.updatedAt),
    sessionCount: metrics.length,
  };
}

function formatRelativeUpdated(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) {
    return 'vừa xong';
  }
  if (minutes < 60) {
    return `${String(minutes)} phút trước`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${String(hours)} giờ trước`;
  }
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${String(days)} ngày trước`;
  }
  return new Date(iso).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
}

export interface ReflectionScope {
  readonly periodLabel: string;
  readonly recent: readonly SessionInsightMetrics[];
}

export function pickReflectionScope(
  metrics: readonly SessionInsightMetrics[],
): ReflectionScope {
  const sorted = [...metrics].sort((a, b) =>
    b.session.updatedAt.localeCompare(a.session.updatedAt),
  );
  const cutoff30 = Date.now() - 30 * DAY_MS;
  const in30Days = sorted.filter(
    (m) => new Date(m.session.updatedAt).getTime() >= cutoff30,
  );

  if (in30Days.length >= 3) {
    return {
      periodLabel: 'Trong 30 ngày gần đây',
      recent: in30Days,
    };
  }

  const count = Math.min(MAX_REFLECTION_SESSIONS, sorted.length);
  return {
    periodLabel: `Trong ${String(count)} phiên gần đây`,
    recent: sorted.slice(0, count),
  };
}

export function exemplarSessionByContinue(
  metrics: readonly SessionInsightMetrics[],
  targetContinue: number,
): SessionInsightMetrics | null {
  if (metrics.length === 0) {
    return null;
  }
  return [...metrics].sort(
    (a, b) =>
      Math.abs(a.continueCount - targetContinue) - Math.abs(b.continueCount - targetContinue),
  )[0] ?? null;
}

export function exemplarSessionByCapitalUsage(
  metrics: readonly SessionInsightMetrics[],
  mode: 'lowest' | 'highest',
): SessionInsightMetrics | null {
  const withUsage = metrics.filter((m) => m.capitalUsagePercent !== null);
  if (withUsage.length === 0) {
    return null;
  }
  return [...withUsage].sort((a, b) => {
    const av = a.capitalUsagePercent ?? 0;
    const bv = b.capitalUsagePercent ?? 0;
    return mode === 'lowest' ? av - bv : bv - av;
  })[0] ?? null;
}

export function mostRecentLostSession(
  metrics: readonly SessionInsightMetrics[],
): SessionInsightMetrics | null {
  return (
    [...metrics]
      .filter((m) => !m.won)
      .sort((a, b) => b.session.updatedAt.localeCompare(a.session.updatedAt))[0] ?? null
  );
}

export function sessionWithMostContinues(
  metrics: readonly SessionInsightMetrics[],
): SessionInsightMetrics | null {
  return (
    [...metrics].sort((a, b) => b.continueCount - a.continueCount)[0] ?? null
  );
}
