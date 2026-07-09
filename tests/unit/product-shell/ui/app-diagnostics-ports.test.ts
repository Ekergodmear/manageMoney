import { describe, expect, it } from 'vitest';

import { createAppDiagnosticsPorts } from '@/product-shell/ui/diagnostics/app-diagnostics-ports';

describe('app diagnostics ports', () => {
  it('maps offline collector as external dependency, not app error', async () => {
    const ports = createAppDiagnosticsPorts({
      fetchCollectorHealth: async () => null,
      notificationCount: 0,
      unreadNotificationCount: 0,
      statisticsError: 'Không tải được thống kê draw',
      statisticsLoading: false,
      statisticsDrawCount: null,
      cloudEnabled: false,
      buildVersion: 'test',
      runtimeHealthy: true,
    });

    const collector = await ports.refreshCollector();
    expect(collector.status).toBe('disabled');
    expect(collector.severity).toBe('info');
    expect(collector.summary).toBe('External service unavailable');

    const statistics = await ports.refreshStatistics();
    expect(statistics.status).toBe('warning');
    expect(statistics.summary).toContain('external dependency');
  });
});
