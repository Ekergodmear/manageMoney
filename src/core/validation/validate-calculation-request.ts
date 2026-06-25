/**
 * Pure ValidationEngine — three-phase pipeline, no input mutation.
 * @see docs/MATHEMATICAL-SPECIFICATION.md §12
 * @see docs/CONTRACTS.md Contract 2
 */

import type { CalculationRequest, ValidatedCalculationRequest } from '@/application/dto';
import type { Result, ValidationResult } from '@/core/contracts';
import { failure, success } from '@/core/contracts';

import { buildValidationResult } from './build-validation-result';
import { runPhase } from './run-phase';
import { businessRules } from './rules/business-rules';
import { mathematicalRules } from './rules/mathematical-rules';
import { structuralRules } from './rules/structural-rules';

export function validateCalculationRequest(
  request: CalculationRequest,
): Result<ValidatedCalculationRequest, ValidationResult> {
  const structuralErrors = runPhase(request, structuralRules);
  if (structuralErrors.length > 0) {
    return failure(buildValidationResult(structuralErrors, []));
  }

  const businessErrors = runPhase(request, businessRules);
  if (businessErrors.length > 0) {
    return failure(buildValidationResult(businessErrors, []));
  }

  const mathematicalErrors = runPhase(request, mathematicalRules);
  if (mathematicalErrors.length > 0) {
    return failure(buildValidationResult(mathematicalErrors, []));
  }

  return success(request);
}
