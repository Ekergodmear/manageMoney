import type { InsightCard, OutlierSeverity, SessionInsightMetrics } from '@/features/insights/insight-types';
import { formatAmount } from '@/lib/money-format';

export function generateOutliers(metrics: readonly SessionInsightMetrics[]): InsightCard[] {
  if (metrics.length < 3) {
    return [];
  }

  const cards: InsightCard[] = [];
  const betOutlier = detectHighestBetOutlier(metrics);
  if (betOutlier !== null) {
    cards.push(betOutlier);
  }

  const usageOutlier = detectLowUsageLongPlay(metrics);
  if (usageOutlier !== null) {
    cards.push(usageOutlier);
  }

  const continueOutlier = detectContinueOutlier(metrics);
  if (continueOutlier !== null) {
    cards.push(continueOutlier);
  }

  return cards.slice(0, 3);
}

function detectHighestBetOutlier(metrics: readonly SessionInsightMetrics[]): InsightCard | null {
  const bets = metrics.map((m) => m.highestBet).sort((a, b) => a - b);
  const median = bets[Math.floor(bets.length / 2)] ?? 0;
  if (median <= 0) {
    return null;
  }

  const threshold = median * 1.75;
  const outlier = metrics
    .filter((m) => m.highestBet >= threshold)
    .sort((a, b) => b.highestBet - a.highestBet)[0];

  if (outlier === undefined) {
    return null;
  }

  const ratio = outlier.highestBet / median;
  const severity: OutlierSeverity = ratio >= 2.2 ? 'critical' : 'notable';
  const date = formatSessionDate(outlier.session.updatedAt);

  return outlierCard({
    id: `outlier-bet-${outlier.session.id}`,
    severity,
    sessionTitle: outlier.session.title,
    date,
    metricLabel: 'Highest Bet',
    metricValue: `${formatAmount(outlier.highestBet)} đ`,
    conclusion:
      severity === 'critical'
        ? `→ Cao hơn ~${String(Math.round((ratio - 1) * 100))}% so với các phiên khác.`
        : '→ Cao hơn trung vị — đáng xem lại plan tại phiên này.',
    sessionId: outlier.session.id,
  });
}

function detectLowUsageLongPlay(metrics: readonly SessionInsightMetrics[]): InsightCard | null {
  const usageValues = metrics
    .map((m) => m.capitalUsagePercent)
    .filter((v): v is number => v !== null);
  if (usageValues.length < 3) {
    return null;
  }

  const avgUsage = usageValues.reduce((a, b) => a + b, 0) / usageValues.length;
  const candidate = metrics
    .filter(
      (m) =>
        m.capitalUsagePercent !== null &&
        m.capitalUsagePercent < avgUsage * 0.55 &&
        m.roundsPlayed >= 200,
    )
    .sort((a, b) => (a.capitalUsagePercent ?? 100) - (b.capitalUsagePercent ?? 100))[0];

  if (candidate === undefined) {
    return null;
  }

  const date = formatSessionDate(candidate.session.updatedAt);

  return outlierCard({
    id: `outlier-usage-${candidate.session.id}`,
    severity: 'notable',
    sessionTitle: candidate.session.title,
    date,
    metricLabel: 'Capital Usage',
    metricValue: `${String(candidate.capitalUsagePercent)}%`,
    conclusion: `→ ${String(candidate.roundsPlayed)} vòng nhưng vốn còn dư nhiều.`,
    sessionId: candidate.session.id,
  });
}

function detectContinueOutlier(metrics: readonly SessionInsightMetrics[]): InsightCard | null {
  const continues = metrics.map((m) => m.continueCount);
  const avg = continues.reduce((a, b) => a + b, 0) / continues.length;
  if (avg < 1) {
    return null;
  }

  const outlier = metrics
    .filter((m) => m.continueCount >= avg * 2.5 && m.continueCount >= 3)
    .sort((a, b) => b.continueCount - a.continueCount)[0];

  if (outlier === undefined) {
    return null;
  }

  const severity: OutlierSeverity = outlier.continueCount >= 5 ? 'critical' : 'notable';
  const date = formatSessionDate(outlier.session.updatedAt);

  return outlierCard({
    id: `outlier-continue-${outlier.session.id}`,
    severity,
    sessionTitle: outlier.session.title,
    date,
    metricLabel: 'Continue',
    metricValue: `${String(outlier.continueCount)} lần`,
    conclusion: '→ Kế hoạch ban đầu có thể quá ngắn cho phiên này.',
    sessionId: outlier.session.id,
  });
}

function outlierCard(opts: {
  id: string;
  severity: OutlierSeverity;
  sessionTitle: string;
  date: string;
  metricLabel: string;
  metricValue: string;
  conclusion: string;
  sessionId: string;
}): InsightCard {
  const severityLabel = opts.severity === 'critical' ? 'Bất thường' : 'Đáng chú ý';
  const emoji = opts.severity === 'critical' ? '🔴' : '🟡';

  return {
    id: opts.id,
    layer: 'outlier',
    emoji,
    severity: opts.severity,
    title: `${severityLabel} · ${opts.date}`,
    body: `${opts.metricLabel}: ${opts.metricValue} — ${opts.sessionTitle}`,
    conclusion: opts.conclusion,
    action: {
      label: 'Mở Session',
      target: 'session',
      sessionId: opts.sessionId,
    },
  };
}

function formatSessionDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
}
