import { describe, expect, it, vi } from 'vitest';

import type { DiagnosticCapability, DiagnosticSnapshot } from '@/product-shell/types/diagnostics';
import { createDiagnosticCapabilities } from '@/product-shell/ui/diagnostics/create-capabilities';

function snapshot(summary: string, severity: DiagnosticSnapshot['severity']): DiagnosticSnapshot {
  return {
    status: severity === 'critical' ? 'error' : severity === 'warning' ? 'warning' : 'ok',
    severity,
    summary,
    rows: [{ label: 'Detail', value: 'ok' }],
    checkedAt: '2026-06-30T00:00:00.000Z',
  };
}

function refresh(summary: string, severity: DiagnosticSnapshot['severity']): () => Promise<DiagnosticSnapshot> {
  return () => Promise.resolve(snapshot(summary, severity));
}

describe('diagnostic capabilities', () => {
  it('refreshes collector severity and summary', async () => {
    const capabilities = createDiagnosticCapabilities({
      refreshCollector: refresh('Collector unreachable', 'critical'),
      refreshStorage: refresh('0 sessions', 'info'),
      refreshRuntime: refresh('Runtime healthy', 'info'),
      refreshNotifications: refresh('0 unread', 'info'),
      refreshStatistics: refresh('Statistics ready', 'info'),
      refreshCloud: refresh('Cloud disabled', 'info'),
    });

    const collector = capabilities.find((entry) => entry.id === 'collector');
    expect(collector).toBeDefined();
    if (collector === undefined) {
      return;
    }
    const result = await collector.refresh();
    expect(result.severity).toBe('critical');
    expect(result.summary).toBe('Collector unreachable');
  });

  it('creates exactly six capabilities', () => {
    const ports = {
      refreshCollector: vi.fn(refresh('a', 'info')),
      refreshStorage: vi.fn(refresh('b', 'info')),
      refreshRuntime: vi.fn(refresh('c', 'info')),
      refreshNotifications: vi.fn(refresh('d', 'info')),
      refreshStatistics: vi.fn(refresh('e', 'info')),
      refreshCloud: vi.fn(refresh('f', 'info')),
    };
    const capabilities = createDiagnosticCapabilities(ports);
    expect(capabilities.map((entry) => entry.id)).toEqual([
      'collector',
      'storage',
      'runtime',
      'notifications',
      'statistics',
      'cloud',
    ]);
  });
});

describe('diagnostic capability contract', () => {
  it('keeps refresh-only capability shape from runtime types', () => {
    const capability: DiagnosticCapability = {
      id: 'cloud',
      title: 'Cloud',
      refresh: refresh('Cloud disabled', 'info'),
    };
    expect(capability.title).toBe('Cloud');
    expect(typeof capability.refresh).toBe('function');
  });
});
