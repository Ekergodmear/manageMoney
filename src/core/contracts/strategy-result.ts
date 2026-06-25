/**
 * Full strategy generation pipeline output.
 * Field order reflects workflow: generate → validate → statistics → metadata.
 * @see docs/DOMAIN-LANGUAGE.md
 */

import type { Strategy, StrategyStatistics } from '@/core/models';

import type { ValidationResult } from './validation-result';

export interface StrategyMetadata {
  readonly generatedAt: Date;
  readonly algorithm: string;
  readonly version: string;
}

export interface StrategyResult {
  readonly strategy: Strategy;
  readonly validation: ValidationResult;
  readonly statistics: StrategyStatistics;
  readonly metadata: StrategyMetadata;
}
