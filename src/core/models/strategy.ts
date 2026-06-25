/**
 * Deterministic betting plan.
 * @see docs/DOMAIN-LANGUAGE.md
 */

import type { Round } from './round';

export interface Strategy {
  readonly rounds: readonly Round[];
}
