/**
 * Profit mode literals — union type, not enum.
 * @see docs/FLOWS.md — TargetProfit flow
 */

export type ProfitMode = 'breakEven' | 'fixedAmount' | 'percentage';
