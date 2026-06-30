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

describe('diagnostic capabilities', () => {
  it('refreshes collector severity and summary', async () => {
    const capabilities = createDiagnosticCapabilities({
      refreshCollector: async () => snapshot('Collector unreachable', 'critical'),
      refreshStorage: async () => snapshot('0 sessions', 'info'),
      refreshRuntime: async () => snapshot('Runtime healthy', 'info'),
      refreshNotifications: async () => snapshot('0 unread', 'info'),
      refreshStatistics: async () => snapshot('Statistics ready', 'info'),
      refreshCloud: async () => snapshot('Cloud disabled', 'info'),
    });

    const collector = capabilities.find((entry) => entry.id === 'collector');
    expect(collector).toBeDefined();
    const result = await collector!.refresh();
    expect(result.severity).toBe('critical');
    expect(result.summary).toBe('Collector unreachable');
  });

  it('creates exactly six capabilities', () => {
    const ports = {
      refreshCollector: vi.fn(async () => snapshot('a', 'info')),
      refreshStorage: vi.fn(async () => snapshot('b', 'info')),
      refreshRuntime: vi.fn(async () => snapshot('c', 'info')),
      refreshNotifications: vi.fn(async () => snapshot('d', 'info')),
      refreshStatistics: vi.fn(async () => snapshot('e', 'info')),
      refreshCloud: vi.fn(async () => snapshot('f', 'info')),
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
      refresh: async () => snapshot('Cloud disabled', 'info'),
    };
    expect(capability.title).toBe('Cloud');
    expect(typeof capability.refresh).toBe('function');
  });
});
