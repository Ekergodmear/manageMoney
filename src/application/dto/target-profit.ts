/**
 * Discriminated union for profit target — validation uses `mode` narrowing.
 * @see docs/FLOWS.md — TargetProfit flow
 */

import type { ProfitAmount } from '@/core/models';

export type TargetProfit =
  | { readonly mode: 'breakEven' }
  | { readonly mode: 'fixedAmount'; readonly amount: ProfitAmount }
  | { readonly mode: 'percentage'; readonly percentage: number };
