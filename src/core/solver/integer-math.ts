/**
 * Integer-only monetary arithmetic — frozen pseudo-code helpers.
 * @see docs/design/solver-pseudocode.md
 */

export function ceilDiv(a: number, b: number): number {
  return Math.floor((a + b - 1) / b);
}

export function ceilToStep(numerator: number, denominator: number, step: number): number {
  const rawMin = ceilDiv(numerator, denominator);
  return ceilDiv(rawMin, step) * step;
}

export function floorDiv(a: number, b: number): number {
  return Math.floor(a / b);
}
