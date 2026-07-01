import { describe, expect, it } from 'vitest';

import { buildCollectorHealthSnapshot } from '../src/diagnostics/build-snapshot.js';
import {
  formatDiagnosisCause,
  normalizeDiagnosisCause,
} from '../src/diagnostics/diagnosis-cause.js';
import { formatDoctorReport } from '../src/health/format-doctor-report.js';
import { buildFreshnessView, formatAgeLabel } from '../src/health/freshness.js';
import { deriveOperationalStatus } from '../src/health/operational-status.js';
import { resetRetryObservabilityForTests } from '../src/retry/retry-state.js';
import { initialCollectorState } from '../src/types/collector-state.js';

function sampleDraw(collectedAt: string) {
  return {
    drawKey: '20260701083100',
    gameId: 'bingo18',
    marketVersion: 1,
    drawAt: collectedAt,
    publishedAt: collectedAt,
    publishedEstimated: true,
    collectedAt,
    latencyMs: 0,
    dice: [1, 2, 3] as const,
    total: 6,
    flower: null,
    smallLarge: 'small' as const,
    source: 'bingo18',
    rawPayload: {},
    rawResponse: null,
  };
}

describe('R1.4 collector observability', () => {
  const now = Date.parse('2026-07-01T08:37:00.000Z');

  it('healthy snapshot and doctor summary', () => {
    const state = {
      ...initialCollectorState(),
      lastDrawKey: '20260701083100',
      lastSuccessAt: '2026-07-01T08:31:22.000Z',
      lastPollAt: '2026-07-01T08:37:00.000Z',
      lastDraw: sampleDraw('2026-07-01T08:31:22.000Z'),
      resumeState: 'catch-up' as const,
      catchUpCount: 3,
      duplicatesSkipped: 1,
    };
    const snapshot = buildCollectorHealthSnapshot({
      state,
      adapterId: 'bingo18',
      drawCount: 120,
      latestDraw: state.lastDraw,
      retry: {
        retryCount: 2,
        lastRetryAt: '2026-07-01T08:30:00.000Z',
        lastErrorType: 'network',
        lastSuccessAt: '2026-07-01T08:31:22.000Z',
      },
      now,
    });
    const text = formatDoctorReport(snapshot);

    expect(snapshot.status).toBe('healthy');
    expect(text).toContain('Status            Healthy');
    expect(text).toContain('Adapter           Bingo18');
    expect(text).toContain('Latest Draw       20260701083100');
    expect(text).toContain('Resume State      Catch-up');
    expect(text).toContain('Retry Count       2');
    expect(text).toContain('Catch-up Count    3');
    expect(text).toContain('Duplicates Skip   1');
    expect(text).not.toContain('Last Error');
  });

  it('degraded snapshot shows last failure for timeout', () => {
    resetRetryObservabilityForTests();
    const state = {
      ...initialCollectorState(),
      status: 'degraded' as const,
      failureCount: 2,
      lastDrawKey: '20260701083100',
      lastSuccessAt: '2026-07-01T07:00:00.000Z',
      lastPollAt: '2026-07-01T08:37:00.000Z',
      lastDraw: sampleDraw('2026-07-01T07:00:00.000Z'),
    };
    const snapshot = buildCollectorHealthSnapshot({
      state,
      adapterId: 'bingo18',
      drawCount: 10,
      latestDraw: state.lastDraw,
      retry: {
        retryCount: 2,
        lastRetryAt: '2026-07-01T08:32:12.000Z',
        lastErrorType: 'timeout',
        lastSuccessAt: '2026-07-01T07:00:00.000Z',
      },
      now,
    });
    const text = formatDoctorReport(snapshot);

    expect(snapshot.status).toBe('degraded');
    expect(snapshot.diagnosis).toBe('timeout');
    expect(text).toContain('Status            Degraded');
    expect(text).toContain('Last Error');
    expect(text).toContain('Type              Timeout');
    expect(text).toContain('Retry             2 / 3');
    expect(text).toContain('Duration          10s');
  });

  it('offline when collector is stopped', () => {
    const state = {
      ...initialCollectorState(),
      status: 'stopped' as const,
      lastPollAt: '2026-07-01T08:00:00.000Z',
    };
    const snapshot = buildCollectorHealthSnapshot({
      state,
      adapterId: 'bingo18',
      drawCount: 0,
      latestDraw: null,
      retry: {
        retryCount: 0,
        lastRetryAt: null,
        lastErrorType: null,
        lastSuccessAt: null,
      },
      now,
    });

    expect(snapshot.status).toBe('offline');
    expect(formatDoctorReport(snapshot)).toContain('Status            Offline');
  });

  it('retry state surfaces in summary', () => {
    const snapshot = buildCollectorHealthSnapshot({
      state: {
        ...initialCollectorState(),
        lastDrawKey: '20260701083100',
        lastSuccessAt: '2026-07-01T08:31:22.000Z',
        lastPollAt: '2026-07-01T08:37:00.000Z',
      },
      adapterId: 'bingo18',
      drawCount: 1,
      latestDraw: sampleDraw('2026-07-01T08:31:22.000Z'),
      retry: {
        retryCount: 1,
        lastRetryAt: '2026-07-01T08:30:00.000Z',
        lastErrorType: 'network',
        lastSuccessAt: '2026-07-01T08:31:22.000Z',
      },
      now,
    });

    expect(snapshot.summary.retryCount).toBe(1);
    expect(formatDoctorReport(snapshot)).toContain('Retry Count       1');
  });

  it('stale draw freshness warns', () => {
    const collectedAt = '2026-07-01T08:00:00.000Z';
    const freshness = buildFreshnessView(sampleDraw(collectedAt), now, 10 * 60_000);

    expect(freshness.stale).toBe(true);
    expect(freshness.lastDrawAgeLabel).toBe('2220s');
    expect(freshness.warning).toContain('older than');
  });

  it('sqlite busy diagnosis mapping', () => {
    expect(normalizeDiagnosisCause('sqlite_busy')).toBe('sqlite_busy');
    expect(formatDiagnosisCause('sqlite_busy')).toBe('SQLite Busy');

    const snapshot = buildCollectorHealthSnapshot({
      state: {
        ...initialCollectorState(),
        status: 'degraded' as const,
        failureCount: 1,
        lastDrawKey: '20260701083100',
        lastSuccessAt: '2026-07-01T08:00:00.000Z',
        lastPollAt: '2026-07-01T08:37:00.000Z',
      },
      adapterId: 'bingo18',
      drawCount: 3,
      latestDraw: sampleDraw('2026-07-01T08:00:00.000Z'),
      retry: {
        retryCount: 1,
        lastRetryAt: '2026-07-01T08:36:00.000Z',
        lastErrorType: null,
        lastSuccessAt: '2026-07-01T08:00:00.000Z',
      },
      diagnosisOverride: 'sqlite_busy',
      now,
    });

    expect(snapshot.diagnosis).toBe('sqlite_busy');
    expect(formatDoctorReport(snapshot)).toContain('Type              SQLite Busy');
  });

  it('snapshot mapping preserves DTO shape for diagnostics capability', () => {
    const snapshot = buildCollectorHealthSnapshot({
      state: initialCollectorState(),
      adapterId: 'mock',
      drawCount: 0,
      latestDraw: null,
      now,
    });

    expect(snapshot).toMatchObject({
      status: expect.any(String),
      diagnosis: null,
      summary: {
        adapter: 'Mock',
        retryCount: expect.any(Number),
        catchUpCount: expect.any(Number),
        duplicatesSkipped: expect.any(Number),
      },
      details: {
        drawCount: 0,
        failureCount: 0,
        runtimeStatus: 'running',
      },
      freshness: {
        lastDrawAgeLabel: expect.any(String),
        stale: expect.any(Boolean),
      },
    });
  });

  it('formatAgeLabel renders seconds', () => {
    expect(formatAgeLabel(45_000)).toBe('45s');
    expect(formatAgeLabel(120_000)).toBe('120s');
    expect(formatAgeLabel(420_000)).toBe('420s');
  });

  it('deriveOperationalStatus marks offline when poll is stale', () => {
    const status = deriveOperationalStatus(
      {
        ...initialCollectorState(),
        status: 'running',
        lastPollAt: '2026-07-01T08:00:00.000Z',
        lastSuccessAt: '2026-07-01T08:00:00.000Z',
        lastDrawKey: 'x',
      },
      {
        retryCount: 0,
        lastRetryAt: null,
        lastErrorType: null,
        lastSuccessAt: null,
      },
      now,
      { offlinePollMs: 60_000 },
    );
    expect(status).toBe('offline');
  });
});
