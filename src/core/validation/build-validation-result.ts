/**
 * Build ValidationResult with precomputed counts for UI.
 */

import type { ValidationError, ValidationResult } from '@/core/contracts';

export function buildValidationResult(
  errors: readonly ValidationError[],
  warnings: readonly ValidationError[],
): ValidationResult {
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    errorCount: errors.length,
    warningCount: warnings.length,
  };
}
