export type SmallLarge = 'small' | 'tie' | 'large';

/** Aligns with Game Integration v1 — shared shape for future packages/contracts. */
export interface DrawResult {
  readonly id: string;
  readonly gameId: string;
  readonly marketVersion: number;
  readonly drawNumber: string;
  readonly drawTime: string;
  readonly publishedAt: string | null;
  readonly collectedAt: string;
  readonly latencyMs: number;
  readonly dice: readonly [number, number, number];
  readonly total: number;
  readonly flower: string | null;
  readonly smallLarge: SmallLarge;
  readonly rawPayload: unknown;
  readonly source: string;
}

export function diceTotal(dice: readonly [number, number, number]): number {
  return dice[0] + dice[1] + dice[2];
}

export function classifySmallLarge(total: number): SmallLarge {
  if (total <= 9) return 'small';
  if (total <= 11) return 'tie';
  return 'large';
}

export function detectFlower(dice: readonly [number, number, number]): string | null {
  if (dice[0] === dice[1] && dice[1] === dice[2]) {
    return `${dice[0]}${dice[1]}${dice[2]}`;
  }
  return null;
}
