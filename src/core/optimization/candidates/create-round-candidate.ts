/**
 * Pure candidate constructor — shapes CalculationRequest for round search.
 * No validation, no policy, no engine imports.
 */

import type { CalculationRequest, RoundCount } from '@/application/dto';

export function createRoundCandidate(
  intent: CalculationRequest,
  roundCount: RoundCount,
): CalculationRequest {
  return {
    ...intent,
    roundCount,
  };
}
