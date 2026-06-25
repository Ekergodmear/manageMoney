/**
 * Validation types — rules registry.
 */

import type { CalculationRequest } from '@/application/dto';
import type { ValidationError, ValidationLayer } from '@/core/contracts';

export type { ValidationError, ValidationLayer };

export interface ValidationRule {
  readonly code: string;
  readonly path: string;
  readonly layer: ValidationLayer;
  readonly message: string;
  readonly isValid: (request: CalculationRequest) => boolean;
}

export type ValidationPhase = readonly ValidationRule[];
