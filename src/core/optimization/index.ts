/**
 * OptimizationEngine module — not Core SDK v1 public export (RFC-005).
 * @see docs/rfc/README.md
 */

export { optimize } from './optimize';

export type { SearchPolicy } from './search-policy';
export { defaultSearchPolicy } from './search-policy';

export type { OptimizationRequest } from './models/optimization-request';
export type {
  OptimizationResult,
  OptimizationSuccess,
  OptimizationFailure,
} from './models/optimization-result';
export type {
  OptimizationExplanation,
  OptimizationReason,
} from './models/optimization-explanation';
export { OptimizationReasons } from './models/optimization-explanation';
export type { OptimizationErrorCode } from './models/optimization-error';
export { OptimizationErrorCodes } from './models/optimization-error';
