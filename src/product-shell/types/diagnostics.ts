export type DiagnosticStatus = 'ok' | 'warning' | 'error' | 'disabled';

export type Severity = 'info' | 'warning' | 'critical';

export interface DiagnosticRow {
  readonly label: string;
  readonly value: string;
  readonly hint?: string;
  readonly severity?: Severity;
}

export interface DiagnosticSnapshot {
  readonly status: DiagnosticStatus;
  readonly severity: Severity;
  readonly summary: string;
  readonly rows: readonly DiagnosticRow[];
  readonly checkedAt: string;
}

export interface DiagnosticCapability {
  readonly id: string;
  readonly title: string;
  readonly refresh: () => Promise<DiagnosticSnapshot>;
}
