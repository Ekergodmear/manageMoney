import type { GamePolicyPreset } from '@/features/game-designer/game-policy-types';
import {
  CAPITAL_GOAL_LABELS,
  type CapitalPlannerSnapshot,
} from '@/features/capital/capital-planner-types';
import type {
  AggregatedInsightMetrics,
  InsightCard,
  InsightRecord,
  SessionInsightMetrics,
} from '@/features/insights/insight-types';
import {
  confidenceFromSampleSize,
  exemplarSessionByCapitalUsage,
  exemplarSessionByContinue,
} from '@/features/insights/insight-confidence';
import {
  computeSessionStatistics,
  getCurrentPlan,
  type Session,
} from '@/features/session/session-domain';
import { computeCapitalUsagePercent } from '@/features/session/session-health';
import { formatAmount } from '@/lib/money-format';

export function insightsEligibleSessions(sessions: readonly Session[]): Session[] {
  return sessions.filter(
    (s) =>
      !s.archived &&
      (s.status === 'won' || s.status === 'lost' || s.status === 'stopped'),
  );
}

export function buildSessionMetrics(
  sessions: readonly Session[],
  presets: readonly GamePolicyPreset[],
): SessionInsightMetrics[] {
  return sessions.map((session) => {
    const stats = computeSessionStatistics(session);
    const plan = getCurrentPlan(session) ?? session.plans[session.plans.length - 1];
    const preset = presets.find((p) => p.id === session.presetId);
    const usage = plan !== undefined ? computeCapitalUsagePercent(plan) : null;

    return {
      session,
      presetName: preset?.name ?? session.presetId,
      roundsPlayed: stats.roundsPlayed,
      continueCount: stats.continueCount,
      improveCount: stats.improveCount,
      planCount: stats.planCount,
      highestBet: stats.highestBet,
      totalCapital: stats.totalCapital,
      capitalUsagePercent: usage,
      profitAmount: session.profitAmount,
      won: session.status === 'won',
    };
  });
}

export function aggregateMetrics(metrics: readonly SessionInsightMetrics[]): AggregatedInsightMetrics {
  const totalCompleted = metrics.length;
  const winCount = metrics.filter((m) => m.won).length;

  const usageValues = metrics
    .map((m) => m.capitalUsagePercent)
    .filter((v): v is number => v !== null);
  const avgCapitalUsage =
    usageValues.length > 0
      ? Math.round(usageValues.reduce((a, b) => a + b, 0) / usageValues.length)
      : null;

  const avgContinue =
    totalCompleted > 0
      ? Math.round((metrics.reduce((a, m) => a + m.continueCount, 0) / totalCompleted) * 10) / 10
      : 0;

  const avgImprove =
    totalCompleted > 0
      ? Math.round((metrics.reduce((a, m) => a + m.improveCount, 0) / totalCompleted) * 10) / 10
      : 0;

  const continueSessions = metrics.filter((m) => m.continueCount > 0);
  let avgRoundsBeforeContinue: number | null = null;
  if (continueSessions.length > 0) {
    const sum = continueSessions.reduce((a, m) => {
      const perContinue = m.continueCount > 0 ? m.roundsPlayed / (m.continueCount + 1) : m.roundsPlayed;
      return a + perContinue;
    }, 0);
    avgRoundsBeforeContinue = Math.round(sum / continueSessions.length);
  }

  const presetCounts = new Map<string, number>();
  for (const m of metrics) {
    presetCounts.set(m.session.presetId, (presetCounts.get(m.session.presetId) ?? 0) + 1);
  }
  let topPresetId: string | null = null;
  let topCount = 0;
  for (const [id, count] of presetCounts) {
    if (count > topCount) {
      topCount = count;
      topPresetId = id;
    }
  }
  const topPresetShare =
    totalCompleted > 0 && topPresetId !== null ? Math.round((topCount / totalCompleted) * 100) : 0;
  const topPresetName =
    topPresetId !== null
      ? (metrics.find((m) => m.session.presetId === topPresetId)?.presetName ?? null)
      : null;

  let bestWinPresetId: string | null = null;
  let bestWinRate = 0;
  for (const [presetId, group] of groupByPreset(metrics)) {
    if (group.length < 2) {
      continue;
    }
    const rate = group.filter((m) => m.won).length / group.length;
    if (rate > bestWinRate) {
      bestWinRate = rate;
      bestWinPresetId = presetId;
    }
  }
  const bestWinPresetName =
    bestWinPresetId !== null
      ? (metrics.find((m) => m.session.presetId === bestWinPresetId)?.presetName ?? null)
      : null;

  let longestRounds = 0;
  let longestSessionTitle: string | null = null;
  for (const m of metrics) {
    if (m.roundsPlayed > longestRounds) {
      longestRounds = m.roundsPlayed;
      longestSessionTitle = m.session.title;
    }
  }

  return {
    sessions: metrics,
    totalCompleted,
    winCount,
    avgCapitalUsage,
    avgContinue,
    avgImprove,
    avgRoundsBeforeContinue,
    topPresetId,
    topPresetShare,
    topPresetName,
    bestWinPresetId,
    bestWinPresetName,
    bestWinRate: Math.round(bestWinRate * 100),
    longestRounds,
    longestSessionTitle,
    recentSessionCount: metrics.filter(
      (m) => Date.now() - new Date(m.session.updatedAt).getTime() <= 30 * 86_400_000,
    ).length,
  };
}

function groupByPreset(
  metrics: readonly SessionInsightMetrics[],
): Map<string, SessionInsightMetrics[]> {
  const map = new Map<string, SessionInsightMetrics[]>();
  for (const m of metrics) {
    const list = map.get(m.session.presetId) ?? [];
    list.push(m);
    map.set(m.session.presetId, list);
  }
  return map;
}

export function generateQuickSessionInsights(
  agg: AggregatedInsightMetrics,
  metrics: readonly SessionInsightMetrics[],
): InsightCard[] {
  const cards: InsightCard[] = [];
  const confidence = confidenceFromSampleSize(agg.totalCompleted);

  if (agg.topPresetName !== null && agg.totalCompleted > 0) {
    cards.push({
      id: 'quick-top-preset',
      layer: 'quick',
      emoji: '📈',
      title: 'Game chủ đạo',
      body: `${agg.topPresetName} gần như là game mặc định — ${String(agg.topPresetShare)}% phiên của bạn.`,
      conclusion:
        agg.topPresetShare >= 70
          ? '→ Bạn chơi rất tập trung vào một game.'
          : '→ Vẫn còn không gian thử game khác.',
      confidence,
    });
  }

  if (agg.avgCapitalUsage !== null) {
    const unused = 100 - agg.avgCapitalUsage;
    const exemplar =
      unused >= 15
        ? exemplarSessionByCapitalUsage(metrics, 'lowest')
        : exemplarSessionByCapitalUsage(metrics, 'highest');

    cards.push({
      id: 'quick-capital-usage',
      layer: 'quick',
      emoji: '💰',
      title: 'Vốn',
      body:
        unused >= 20
          ? `Bạn đang để khoảng ${String(unused)}% vốn nhàn rỗi mỗi phiên.`
          : agg.avgCapitalUsage > 90
            ? 'Bạn thường dùng gần hết vốn kế hoạch mỗi phiên.'
            : `Mức dùng vốn trung bình ${String(agg.avgCapitalUsage)}% — khá cân bằng.`,
      conclusion:
        unused >= 20
          ? '→ Có thể tăng mục tiêu hoặc chia thêm một phiên.'
          : agg.avgCapitalUsage > 90
            ? '→ Cân nhắc tăng bankroll trước phiên tiếp theo.'
            : undefined,
      confidence,
      ...(exemplar !== null
        ? {
            action: {
              label: 'Mở Session',
              target: 'session' as const,
              sessionId: exemplar.session.id,
            },
          }
        : {}),
    });
  }

  if (agg.totalCompleted > 0) {
    const exemplar = exemplarSessionByContinue(metrics, Math.round(agg.avgContinue));
    const continuePhrase =
      agg.avgContinue < 0.5
        ? 'Hầu hết phiên bạn không cần Continue.'
        : Math.abs(agg.avgContinue - 1) < 0.35
          ? 'Bạn thường Continue đúng 1 lần.'
          : `Bạn Continue trung bình ${String(agg.avgContinue)} lần mỗi phiên.`;

    cards.push({
      id: 'quick-avg-continue',
      layer: 'quick',
      emoji: '🎯',
      title: 'Continue',
      body: continuePhrase,
      conclusion:
        agg.avgRoundsBeforeContinue !== null && agg.avgContinue >= 1
          ? `→ Thường cần thêm vòng sau khoảng ${String(agg.avgRoundsBeforeContinue)} vòng đầu.`
          : agg.avgContinue < 0.5
            ? '→ Kế hoạch ban đầu thường đủ dài cho cách chơi của bạn.'
            : undefined,
      confidence,
      ...(exemplar !== null && exemplar.continueCount > 0
        ? {
            action: {
              label: 'Mở Session',
              target: 'session' as const,
              sessionId: exemplar.session.id,
            },
          }
        : {}),
    });
  }

  return cards;
}

export function generateRecords(
  metrics: readonly SessionInsightMetrics[],
): InsightRecord[] {
  if (metrics.length === 0) {
    return [];
  }

  let longestRounds = 0;
  let longestId: string | undefined;
  let longestTitle: string | undefined;
  let highestBet = 0;
  let highestBetId: string | undefined;
  let highestBetTitle: string | undefined;
  let mostContinues = 0;
  let mostContinuesId: string | undefined;
  let mostContinuesTitle: string | undefined;
  let largestProfit = 0;
  let largestProfitId: string | undefined;
  let largestProfitTitle: string | undefined;

  for (const m of metrics) {
    if (m.roundsPlayed > longestRounds) {
      longestRounds = m.roundsPlayed;
      longestId = m.session.id;
      longestTitle = m.session.title;
    }
    if (m.highestBet > highestBet) {
      highestBet = m.highestBet;
      highestBetId = m.session.id;
      highestBetTitle = m.session.title;
    }
    if (m.continueCount > mostContinues) {
      mostContinues = m.continueCount;
      mostContinuesId = m.session.id;
      mostContinuesTitle = m.session.title;
    }
    if (m.profitAmount !== null && m.profitAmount > largestProfit) {
      largestProfit = m.profitAmount;
      largestProfitId = m.session.id;
      largestProfitTitle = m.session.title;
    }
  }

  const records: InsightRecord[] = [
    {
      id: 'record-longest',
      emoji: '🏆',
      label: 'Phiên dài nhất',
      value: `${String(longestRounds)} vòng`,
      detail: longestTitle,
      sessionId: longestId,
    },
    {
      id: 'record-highest-bet',
      emoji: '💸',
      label: 'Cược cao nhất',
      value: `${formatAmount(highestBet)} đ`,
      detail: highestBetTitle,
      sessionId: highestBetId,
    },
    {
      id: 'record-continues',
      emoji: '↩️',
      label: 'Nhiều Continue nhất',
      value: `${String(mostContinues)} lần`,
      detail: mostContinuesTitle,
      sessionId: mostContinuesId,
    },
  ];

  if (largestProfit > 0) {
    records.push({
      id: 'record-profit',
      emoji: '💰',
      label: 'Lợi nhuận lớn nhất',
      value: `+${formatAmount(largestProfit)} đ`,
      detail: largestProfitTitle,
      sessionId: largestProfitId,
    });
  }

  return records;
}

export function strategyQuickInsight(
  agg: AggregatedInsightMetrics,
  capitalPlanner: CapitalPlannerSnapshot | null,
): InsightCard | null {
  const confidence = confidenceFromSampleSize(agg.totalCompleted);

  if (capitalPlanner !== null) {
    const label = CAPITAL_GOAL_LABELS[capitalPlanner.strategy];
    return {
      id: 'quick-strategy',
      layer: 'quick',
      emoji: '🔥',
      title: 'Strategy',
      body: `${label} là hướng bạn chọn gần nhất trong Capital Planner.`,
      conclusion:
        agg.winCount > 0
          ? '→ Đây là khung strategy bạn đang theo khi lập kế hoạch.'
          : undefined,
      confidence,
    };
  }

  if (agg.bestWinPresetName !== null && agg.bestWinRate >= 40 && agg.totalCompleted >= 3) {
    return {
      id: 'quick-strategy',
      layer: 'quick',
      emoji: '🔥',
      title: 'Strategy ổn định',
      body: `${agg.bestWinPresetName} đang cho tỷ lệ thắng tốt nhất (${String(agg.bestWinRate)}%).`,
      conclusion: '→ Đáng giữ làm lựa chọn chính khi data còn ít.',
      confidence,
    };
  }

  return null;
}
