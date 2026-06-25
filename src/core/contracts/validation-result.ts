/**
 * Rich validation output for UI rendering.
 * @see docs/DOMAIN-LANGUAGE.md
 */

export type ValidationLayer = 'structural' | 'business' | 'mathematical';

export interface ValidationError {
  readonly code: string;
  readonly message: string;
  readonly path: string;
  readonly layer: ValidationLayer;
}

export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly ValidationError[];
  readonly warnings: readonly ValidationError[];
  readonly errorCount: number;
  readonly warningCount: number;
}
