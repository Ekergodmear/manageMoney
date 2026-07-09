export type SettlementAlertKind = 'win' | 'rounds-remaining' | 'plan-exhausted';

export interface SettlementAlert {
  readonly kind: SettlementAlertKind;
  readonly message: string;
  readonly netPrize?: number;
  readonly roundsRemaining?: number;
}

export function alertsFromSettlement(
  won: boolean,
  netPrize: number,
  completedThroughRound: number,
  totalRounds: number,
  previousCompleted: number,
): SettlementAlert[] {
  const alerts: SettlementAlert[] = [];

  if (won) {
    alerts.push({
      kind: 'win',
      message: `Trúng thưởng! +${netPrize.toLocaleString('vi-VN')}đ`,
      netPrize,
    });
    return alerts;
  }

  const remaining = totalRounds - completedThroughRound;
  if (remaining > 0 && remaining <= 5 && completedThroughRound > previousCompleted) {
    alerts.push({
      kind: 'rounds-remaining',
      message: `Còn ${String(remaining)} kỳ.`,
      roundsRemaining: remaining,
    });
  }
  if (remaining === 0 && completedThroughRound > previousCompleted) {
    alerts.push({
      kind: 'plan-exhausted',
      message: 'Hết kế hoạch — chưa trúng.',
    });
  }

  return alerts;
}
