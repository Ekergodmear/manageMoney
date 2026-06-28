/**
 * Tier tax on gross win amount — optional game rule on CalculationRequest.
 * @see docs/design/tier-win-tax-brief.md
 */

export interface WinTax {
  /** Gross win at or above this amount (VND, positive integer) triggers tax. */
  readonly threshold: number;
  /** Tax rate on gross win, integer percent 1–99 (e.g. 10 = 10%). */
  readonly ratePercent: number;
}
