/** Số cách ra mỗi tổng với 3 xúc xắc (216 outcomes). */
export const TOTAL_WAYS: Readonly<Record<number, number>> = {
  3: 1,
  4: 3,
  5: 6,
  6: 10,
  7: 15,
  8: 21,
  9: 25,
  10: 27,
  11: 27,
  12: 25,
  13: 21,
  14: 15,
  15: 10,
  16: 6,
  17: 3,
  18: 1,
};

export const DICE_OUTCOMES = 216;

export function probabilityFromWays(ways: number): number {
  return ways / DICE_OUTCOMES;
}

/** small ≤9, tie 10–11, large ≥12 — khớp `classifySmallLarge` trong Collector. */
export function sizeWays(kind: 'small' | 'tie' | 'large'): number {
  if (kind === 'tie') {
    return (TOTAL_WAYS[10] ?? 0) + (TOTAL_WAYS[11] ?? 0);
  }
  if (kind === 'small') {
    let ways = 0;
    for (let t = 3; t <= 9; t++) {
      ways += TOTAL_WAYS[t] ?? 0;
    }
    return ways;
  }
  let ways = 0;
  for (let t = 12; t <= 18; t++) {
    ways += TOTAL_WAYS[t] ?? 0;
  }
  return ways;
}
