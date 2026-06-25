/**
 * Optimization output — request + structured explanation (RFC-005).
 * @see docs/rfc/optimization/RFC-005-request.md
 */

import type { CalculationRequest } from '@/application/dto';

import type { OptimizationExplanation } from './optimization-explanation';
import type { OptimizationErrorCode } from './optimization-error';

export interface OptimizationSuccess {
  readonly kind: 'success';
  readonly request: CalculationRequest;
  readonly explanation: OptimizationExplanation;
}

export interface OptimizationFailure {
  readonly kind: 'failure';
  readonly code: OptimizationErrorCode;
  readonly explanation: OptimizationExplanation;
}

export type OptimizationResult = OptimizationSuccess | OptimizationFailure;
