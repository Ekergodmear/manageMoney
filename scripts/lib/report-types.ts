export type StepStatus = 'PASS' | 'FAIL' | 'SKIP';

export type VerifyVerdict = 'READY' | 'READY FOR RC' | 'NOT READY';

export interface VerifyStepReport {
  readonly id: string;
  readonly name: string;
  readonly status: StepStatus;
  readonly durationMs: number;
  readonly passed?: number;
  readonly total?: number;
  readonly failed?: number;
  readonly detail?: string;
  readonly error?: string;
  readonly warnings?: number;
}

export interface QualityScoreBreakdown {
  readonly typecheck: number;
  readonly lint: number;
  readonly tests: number;
  readonly architecture: number;
  readonly build: number;
  readonly total: number;
  readonly max: number;
}

export interface VerifyReport {
  readonly date: string;
  readonly commit: string;
  readonly branch: string;
  readonly status: StepStatus;
  readonly verdict: VerifyVerdict;
  readonly reasons: readonly string[];
  readonly durationMs: number;
  readonly warnings: readonly string[];
  readonly steps: readonly VerifyStepReport[];
  readonly buildTimeMs?: number;
  readonly bundleBytes?: number;
  readonly bundleFiles?: number;
  readonly lintErrorCount?: number;
  readonly qualityScore?: QualityScoreBreakdown;
  readonly totalWarnings?: number;
  readonly profile?: 'rc' | 'nightly';
  readonly nightlyFailures?: readonly string[];
}

export interface LatestJsonReport {
  readonly date: string;
  readonly commit: string;
  readonly branch: string;
  readonly status: StepStatus;
  readonly verdict: VerifyVerdict;
  readonly reasons: readonly string[];
  readonly tests: {
    readonly typecheck: StepStatus;
    readonly lint: StepStatus;
    readonly unit: StepStatus;
    readonly architecture: StepStatus;
    readonly gameData: StepStatus;
    readonly notifications: StepStatus;
    readonly build: StepStatus;
    readonly smoke?: StepStatus;
    readonly property?: StepStatus;
    readonly soak?: StepStatus;
    readonly performance?: StepStatus;
  };
  readonly unitPassed?: number;
  readonly unitTotal?: number;
  readonly durationMs: number;
  readonly buildTimeMs?: number;
  readonly bundleBytes?: number;
  readonly qualityScore?: number;
  readonly totalWarnings?: number;
}

export interface TrendEntry {
  readonly date: string;
  readonly tests: number;
  readonly passed: number;
  readonly durationMs: number;
  readonly status: StepStatus;
}
