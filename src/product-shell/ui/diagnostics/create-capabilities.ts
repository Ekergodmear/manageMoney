import type {
  DiagnosticCapability,
  DiagnosticSnapshot,
} from '@/product-shell/types/diagnostics';

export interface DiagnosticsPorts {
  readonly refreshCollector: () => Promise<DiagnosticSnapshot>;
  readonly refreshStorage: () => Promise<DiagnosticSnapshot>;
  readonly refreshRuntime: () => Promise<DiagnosticSnapshot>;
  readonly refreshNotifications: () => Promise<DiagnosticSnapshot>;
  readonly refreshStatistics: () => Promise<DiagnosticSnapshot>;
  readonly refreshCloud: () => Promise<DiagnosticSnapshot>;
}

export function createDiagnosticCapabilities(
  ports: DiagnosticsPorts,
): readonly DiagnosticCapability[] {
  return [
    { id: 'collector', title: 'Collector', refresh: ports.refreshCollector },
    { id: 'storage', title: 'Storage', refresh: ports.refreshStorage },
    { id: 'runtime', title: 'Runtime', refresh: ports.refreshRuntime },
    { id: 'notifications', title: 'Notifications', refresh: ports.refreshNotifications },
    { id: 'statistics', title: 'Statistics', refresh: ports.refreshStatistics },
    { id: 'cloud', title: 'Cloud', refresh: ports.refreshCloud },
  ];
}
