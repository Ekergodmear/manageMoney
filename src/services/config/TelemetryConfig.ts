export interface TelemetryConfig {
  readonly enabled: boolean;
  readonly retentionDays: number;
  /** Future batch flush interval (ms) — M2 append-per-event for now */
  readonly flushIntervalMs: number;
}

export const DEFAULT_TELEMETRY_CONFIG: TelemetryConfig = {
  enabled: true,
  retentionDays: 90,
  flushIntervalMs: 5_000,
};
