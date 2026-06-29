export type SmallLarge = 'small' | 'tie' | 'large';

/** HTTP capture for debug — not used in business logic. */
export interface RawHttpResponse {
  readonly status: number;
  readonly headers: Readonly<Record<string, string>>;
  readonly body: string;
}

/**
 * Frozen after B1.1 — internal contract for Game Integration.
 * Do not change without production evidence.
 */
export interface DrawResult {
  readonly drawKey: string;
  readonly gameId: string;
  readonly marketVersion: number;
  readonly drawAt: string;
  readonly publishedAt: string;
  readonly publishedEstimated: boolean;
  readonly collectedAt: string;
  readonly latencyMs: number;
  readonly dice: readonly [number, number, number];
  readonly total: number;
  readonly flower: string | null;
  readonly smallLarge: SmallLarge;
  readonly source: string;
  readonly rawPayload: unknown;
  readonly rawResponse: RawHttpResponse | null;
}

/** Business key from draw wall-clock time, e.g. 20260629215300 */
export function drawKeyFromDrawAt(drawAt: string): string {
  const m = drawAt.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (m) {
    return `${m[1]}${m[2]}${m[3]}${m[4]}${m[5]}${m[6]}`;
  }
  const digits = drawAt.replace(/\D/g, '');
  return digits.length >= 14 ? digits.slice(0, 14) : digits;
}

export function computeLatencyMs(publishedAt: string, collectedAt: string): number {
  return Math.max(0, new Date(collectedAt).getTime() - new Date(publishedAt).getTime());
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
