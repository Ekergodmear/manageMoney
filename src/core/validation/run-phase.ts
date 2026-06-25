/**
 * Run one validation phase — collect all failing rules in that phase.
 * Does not mutate request.
 */

import type { CalculationRequest } from '@/application/dto';

import type { ValidationError, ValidationPhase } from './types';

export function runPhase(
  request: CalculationRequest,
  rules: ValidationPhase,
): readonly ValidationError[] {
  const errors: ValidationError[] = [];

  for (const rule of rules) {
    if (!rule.isValid(request)) {
      errors.push({
        code: rule.code,
        message: rule.message,
        path: rule.path,
        layer: rule.layer,
      });
    }
  }

  return errors;
}
