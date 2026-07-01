import type { CollectorHealthResponse } from '@/features/game-monitor/collector-api-types';
import type { DiagnosticSnapshot } from '@/product-shell/types/diagnostics';
import type { DiagnosticsPorts } from '@/product-shell/ui/diagnostics/create-capabilities';
import { refreshPersistenceCapability } from '@/product-shell/ui/diagnostics/persistence-capability';

function nowIso(): string {
  return new Date().toISOString();
}

function snapshot(
  severity: DiagnosticSnapshot['severity'],
  summary: string,
  rows: DiagnosticSnapshot['rows'],
  status: DiagnosticSnapshot['status'] = severity === 'critical' ? 'error' : severity === 'warning' ? 'warning' : 'ok',
): DiagnosticSnapshot {
  return {
    status,
    severity,
    summary,
    rows,
    checkedAt: nowIso(),
  };
}

export interface AppDiagnosticsDeps {
  readonly fetchCollectorHealth: () => Promise<CollectorHealthResponse | null>;
  readonly notificationCount: number;
  readonly unreadNotificationCount: number;
  readonly statisticsError: string | null;
  readonly statisticsLoading: boolean;
  readonly statisticsDrawCount: number | null;
  readonly cloudEnabled: boolean;
  readonly buildVersion: string;
  readonly runtimeHealthy: boolean;
}

function mapCollectorHealth(health: CollectorHealthResponse | null): DiagnosticSnapshot {
  if (health === null) {
    return snapshot(
      'critical',
      'Collector unreachable',
      [
        { label: 'Status', value: 'offline' },
        { label: 'Hint', value: 'Start collector service on localhost:8788' },
      ],
      'error',
    );
  }

  const severity =
    health.status === 'running' ? 'info' : health.status === 'degraded' ? 'warning' : 'critical';
  return snapshot(
    severity,
    `${health.drawCount.toLocaleString()} draws · ${health.activeAdapterId}`,
    [
      { label: 'Status', value: health.status },
      { label: 'Last draw', value: health.lastDrawKey ?? '—' },
      { label: 'Failures', value: String(health.failureCount) },
    ],
    health.status === 'running' ? 'ok' : health.status === 'degraded' ? 'warning' : 'error',
  );
}

export function createAppDiagnosticsPorts(deps: AppDiagnosticsDeps): DiagnosticsPorts {
  return {
    refreshCollector: async () => mapCollectorHealth(await deps.fetchCollectorHealth()),

    refreshStorage: refreshPersistenceCapability,

    refreshRuntime: async () =>
      snapshot(
        deps.runtimeHealthy ? 'info' : 'warning',
        deps.runtimeHealthy ? 'Product Shell runtime healthy' : 'Runtime reported warnings',
        [
          { label: 'Build', value: deps.buildVersion },
          { label: 'Shell', value: 'product-shell-v0.5+' },
        ],
        deps.runtimeHealthy ? 'ok' : 'warning',
      ),

    refreshNotifications: async () =>
      snapshot('info', `${deps.unreadNotificationCount} unread notifications`, [
        { label: 'Total', value: String(deps.notificationCount) },
        { label: 'Unread', value: String(deps.unreadNotificationCount) },
      ]),

    refreshStatistics: async () => {
      if (deps.statisticsError !== null) {
        return snapshot(
          'critical',
          'Statistics unavailable',
          [{ label: 'Error', value: deps.statisticsError }],
          'error',
        );
      }
      if (deps.statisticsLoading) {
        return snapshot('warning', 'Statistics refresh in progress', [
          { label: 'State', value: 'loading' },
        ]);
      }
      return snapshot(
        'info',
        deps.statisticsDrawCount !== null
          ? `${deps.statisticsDrawCount.toLocaleString()} draws in statistics cache`
          : 'Statistics ready',
        [
          {
            label: 'Draw count',
            value: deps.statisticsDrawCount !== null ? String(deps.statisticsDrawCount) : '—',
          },
        ],
      );
    },

    refreshCloud: async () =>
      snapshot(
        'info',
        deps.cloudEnabled ? 'Cloud enabled' : 'Cloud disabled',
        [{ label: 'Phase', value: deps.cloudEnabled ? 'enabled' : 'disabled (Product Evolution)' }],
        deps.cloudEnabled ? 'ok' : 'disabled',
      ),
  };
}
