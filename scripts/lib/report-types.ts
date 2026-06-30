export type StepStatus = 'PASS' | 'FAIL' | 'SKIP';

export interface VerifyStepReport {
  readonly id: string;
  readonly name: string;
  readonly status: StepStatus;
  readonly durationMs: number;
  readonly passed?: number;
  readonly total?: number;
  readonly detail?: string;
  readonly error?: string;
}

export interface VerifyReport {
  readonly date: string;
  readonly commit: string;
  readonly branch: string;
  readonly status: StepStatus;
  readonly durationMs: number;
  readonly warnings: readonly string[];
  readonly steps: readonly VerifyStepReport[];
  readonly buildTimeMs?: number;
  readonly bundleBytes?: number;
  readonly bundleFiles?: number;
}

export interface LatestJsonReport {
  readonly date: string;
  readonly commit: string;
  readonly branch: string;
  readonly status: StepStatus;
  readonly tests: {
    readonly typecheck: StepStatus;
    readonly lint: StepStatus;
    readonly unit: StepStatus;
    readonly architecture: StepStatus;
    readonly gameData: StepStatus;
    readonly notifications: StepStatus;
    readonly build: StepStatus;
  };
  readonly unitPassed?: number;
  readonly unitTotal?: number;
  readonly durationMs: number;
  readonly buildTimeMs?: number;
  readonly bundleBytes?: number;
}

export interface TrendEntry {
  readonly date: string;
  readonly tests: number;
  readonly passed: number;
  readonly durationMs: number;
  readonly status: StepStatus;
}
