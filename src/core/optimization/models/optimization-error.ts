/**
 * Optimization error codes — separate from ValidationCodes (RFC-005).
 * @see docs/rfc/optimization/RFC-005-request.md
 */

export const OptimizationErrorCodes = Object.freeze({
  NO_FEASIBLE_SOLUTION: 'NO_FEASIBLE_SOLUTION',
} as const);

export type OptimizationErrorCode =
  (typeof OptimizationErrorCodes)[keyof typeof OptimizationErrorCodes];
