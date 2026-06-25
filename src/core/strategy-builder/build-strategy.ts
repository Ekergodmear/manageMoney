/**
 * Canonical aggregate constructor for Strategy.
 * @see docs/design/strategy-builder-spec.md (FROZEN)
 * @see ADR-034
 */

import type { Round, Strategy } from '@/core/models';

/**
 * Assembles an immutable Strategy from raw round data.
 *
 * Ownership of `rounds` transfers to the returned Strategy — the caller
 * must not mutate the array or round objects after this call.
 *
 * No validation, no derived values, no statistics.
 */
export function buildStrategy(rounds: readonly Round[]): Strategy {
  return { rounds };
}
