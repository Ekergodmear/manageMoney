import type { SessionCompareResult } from '@/features/library/library-types';
import type { Session } from '@/features/session/session-domain';
import { computeSessionStatistics, getCurrentPlan } from '@/features/session/session-domain';
import { formatAmount } from '@/lib/money-format';

function formatMoneyShort(n: number): string {
  if (n >= 1_000_000) {
    return `${String(Math.round(n / 1_000_000))}M`;
  }
  if (n >= 1_000) {
    return `${String(Math.round(n / 1_000))}k`;
  }
  return formatAmount(n);
}

function formatDelta(value: number, id: string): string {
  if (id === 'profit' || id === 'highest-bet') {
    return formatMoneyShort(Math.abs(value));
  }
  return String(Math.abs(value));
}

function deltaLabel(left: number, right: number, id: string): string {
  const d = right - left;
  if (d === 0) {
    return '—';
  }
  const sign = d > 0 ? '+' : '−';
  return `${sign}${formatDelta(d, id)}`;
}

export function compareSessions(left: Session, right: Session): SessionCompareResult {
  const leftStats = computeSessionStatistics(left);
  const rightStats = computeSessionStatistics(right);
  const leftPlan = getCurrentPlan(left);
  const rightPlan = getCurrentPlan(right);

  const leftProfit = left.profitAmount ?? 0;
  const rightProfit = right.profitAmount ?? 0;

  const rows = [
    {
      id: 'profit',
      label: 'Lợi nhuận',
      values: [
        left.profitAmount !== null ? `+${formatMoneyShort(left.profitAmount)}` : '—',
        right.profitAmount !== null ? `+${formatMoneyShort(right.profitAmount)}` : '—',
      ] as [string, string],
      delta: deltaLabel(leftProfit, rightProfit, 'profit'),
    },
    {
      id: 'rounds',
      label: 'Vòng',
      values: [String(leftStats.roundsPlayed), String(rightStats.roundsPlayed)] as [string, string],
      delta: deltaLabel(leftStats.roundsPlayed, rightStats.roundsPlayed, 'rounds'),
    },
    {
      id: 'continue',
      label: 'Continue',
      values: [String(leftStats.continueCount), String(rightStats.continueCount)] as [
        string,
        string,
      ],
      delta: deltaLabel(leftStats.continueCount, rightStats.continueCount, 'continue'),
    },
    {
      id: 'improve',
      label: 'Cải thiện',
      values: [String(leftStats.improveCount), String(rightStats.improveCount)] as [string, string],
      delta: deltaLabel(leftStats.improveCount, rightStats.improveCount, 'improve'),
    },
    {
      id: 'highest-bet',
      label: 'Cược cao nhất',
      values: [formatMoneyShort(leftStats.highestBet), formatMoneyShort(rightStats.highestBet)] as [
        string,
        string,
      ],
      delta: deltaLabel(leftStats.highestBet, rightStats.highestBet, 'highest-bet'),
    },
    {
      id: 'plans',
      label: 'Plans',
      values: [String(leftStats.planCount), String(rightStats.planCount)] as [string, string],
      delta: deltaLabel(leftStats.planCount, rightStats.planCount, 'plans'),
    },
    {
      id: 'status',
      label: 'Trạng thái',
      values: [left.status, right.status] as [string, string],
      delta: '—',
    },
    {
      id: 'multiplier',
      label: 'Hệ số',
      values: [
        leftPlan !== null ? `×${leftPlan.formValues.rewardMultiplier}` : '—',
        rightPlan !== null ? `×${rightPlan.formValues.rewardMultiplier}` : '—',
      ] as [string, string],
      delta: '—',
    },
  ];

  return {
    leftTitle: left.title,
    rightTitle: right.title,
    rows,
  };
}
