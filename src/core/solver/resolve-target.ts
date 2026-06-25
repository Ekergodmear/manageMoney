/**
 * RESOLVE_TARGET — frozen pseudo-code.
 * @see docs/design/solver-pseudocode.md
 */

import type { TargetProfit } from '@/application/dto';

import { floorDiv } from './integer-math';

export function resolveTarget(targetProfit: TargetProfit, accumulatedSpentBefore: number): number {
  switch (targetProfit.mode) {
    case 'breakEven':
      return 0;
    case 'fixedAmount':
      return targetProfit.amount;
    case 'percentage':
      return floorDiv(accumulatedSpentBefore * targetProfit.percentage, 100);
  }
}
