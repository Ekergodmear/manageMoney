import type { StrategyStatistics } from '@stake/constraint-engine';

export function formatPercent(value: number): string {
  return value.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Hiển thị tỷ lệ thắng mục tiêu (chỉ số tham khảo trên UI). */
export function computeTargetWinRatePercent(statistics: StrategyStatistics): number {
  const { roundCount, minimumBetAmount, maximumBetAmount } = statistics;
  if (roundCount <= 0 || minimumBetAmount <= 0) {
    return 0;
  }
  const peakRatio = maximumBetAmount / (minimumBetAmount * roundCount);
  return Math.max(0, Math.min(99.99, (1 - peakRatio) * 100));
}

export function accumulatedAtRound(
  rounds: readonly { accumulatedSpent: number }[],
  completedThroughRound: number,
): number {
  if (completedThroughRound <= 0) {
    return 0;
  }
  const round = rounds[completedThroughRound - 1];
  return round?.accumulatedSpent ?? 0;
}
