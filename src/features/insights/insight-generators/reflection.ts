import type { CapitalPlannerSnapshot } from '@/features/capital/capital-planner-types';
import { CAPITAL_GOAL_LABELS } from '@/features/capital/capital-planner-types';
import {
  confidenceFromSampleSize,
  pickReflectionScope,
} from '@/features/insights/insight-confidence';
import type {
  AggregatedInsightMetrics,
  InsightReflection,
  SessionInsightMetrics,
} from '@/features/insights/insight-types';

export function generateReflection(
  metrics: readonly SessionInsightMetrics[],
  agg: AggregatedInsightMetrics,
  capitalPlanner: CapitalPlannerSnapshot | null,
): InsightReflection | null {
  const { periodLabel, recent } = pickReflectionScope(metrics);
  if (recent.length === 0) {
    return null;
  }

  const lines: string[] = [];
  const confidence = confidenceFromSampleSize(recent.length);

  if (agg.topPresetName !== null) {
    const share = presetShareIn(recent, agg.topPresetId);
    if (share >= 50) {
      lines.push(`Bạn chủ yếu chơi ${agg.topPresetName}.`);
    }
  }

  const avgImprove = recent.reduce((a, m) => a + m.improveCount, 0) / recent.length;
  if (avgImprove < 0.5) {
    lines.push('Bạn ít khi phải Improve.');
  } else if (avgImprove >= 2) {
    lines.push(
      `Bạn thường Improve khoảng ${String(Math.round(avgImprove * 10) / 10)} lần mỗi phiên.`,
    );
  }

  const avgContinue = recent.reduce((a, m) => a + m.continueCount, 0) / recent.length;
  if (avgContinue < 0.5) {
    lines.push('Hầu hết phiên bạn không cần Continue.');
  } else if (Math.abs(avgContinue - 1) < 0.35) {
    lines.push('Bạn thường Continue đúng một lần.');
  } else {
    lines.push(
      `Bạn Continue trung bình ${String(Math.round(avgContinue * 10) / 10)} lần mỗi phiên.`,
    );
  }

  if (capitalPlanner !== null) {
    const label = CAPITAL_GOAL_LABELS[capitalPlanner.strategy];
    const winRate = winRateIn(recent);
    if (winRate >= 50) {
      lines.push(`${label} mang lại hiệu quả ổn định nhất.`);
    } else {
      lines.push(`Bạn đang theo hướng ${label} — còn chỗ để tinh chỉnh.`);
    }
  } else if (agg.bestWinPresetName !== null && agg.bestWinRate >= 50) {
    lines.push(`${agg.bestWinPresetName} là lựa chọn ổn định nhất trong giai đoạn này.`);
  }

  if (lines.length === 0) {
    return null;
  }

  return {
    periodLabel,
    lines: lines.slice(0, 4),
    closingLine: buildClosingLine(recent, avgContinue),
    confidence,
  };
}

function buildClosingLine(
  recent: readonly SessionInsightMetrics[],
  avgContinue: number,
): string {
  const winRate = winRateIn(recent);
  const usageValues = recent
    .map((m) => m.capitalUsagePercent)
    .filter((v): v is number => v !== null);
  const avgUsage =
    usageValues.length > 0
      ? usageValues.reduce((a, b) => a + b, 0) / usageValues.length
      : null;

  if (
    winRate >= 50 &&
    avgContinue <= 1.5 &&
    (avgUsage === null || (avgUsage >= 60 && avgUsage <= 90))
  ) {
    return '=> Hiện tại bạn đang duy trì một chiến lược khá ổn định.';
  }

  if (avgUsage !== null && avgUsage < 65) {
    return '=> Có thể thử tăng số vòng hoặc phân bổ vốn thay vì chỉ tăng lợi nhuận.';
  }

  if (avgContinue >= 2) {
    return '=> Có thể thử tăng số vòng ngay từ đầu thay vì Continue nhiều lần.';
  }

  if (winRate < 40 && recent.length >= 3) {
    return '=> Đáng xem lại kế hoạch ban đầu trước phiên tiếp theo.';
  }

  if (recent.length < 5) {
    return '=> Cần thêm vài phiên nữa để kết luận chắc chắn hơn.';
  }

  return '=> Tiếp tục theo dõi — pattern đang hình thành rõ dần.';
}

function presetShareIn(
  metrics: readonly SessionInsightMetrics[],
  presetId: string | null,
): number {
  if (presetId === null || metrics.length === 0) {
    return 0;
  }
  const count = metrics.filter((m) => m.session.presetId === presetId).length;
  return Math.round((count / metrics.length) * 100);
}

function winRateIn(metrics: readonly SessionInsightMetrics[]): number {
  if (metrics.length === 0) {
    return 0;
  }
  return Math.round((metrics.filter((m) => m.won).length / metrics.length) * 100);
}
