import { describe, expect, it } from 'vitest';

import {
  buildSourceMaintenanceCaption,
  formatDrawPeriodLabel,
} from '@/features/game-data/adapters/draw-period-label';
import {
  isDrawFeedStale,
  SOURCE_MAINTENANCE_STALE_MS,
} from '@/features/game-data/adapters/draw-feed-status';
import type { CollectorDrawResult } from '@/features/game-monitor/collector-api-types';
import {
  notificationFromSourceMaintenance,
} from '@/features/notifications/notification-center';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/features/notifications/notification-types';

const sampleDraw: CollectorDrawResult = {
  drawKey: '20260701091700',
  gameId: 'bingo18',
  marketVersion: 1,
  drawAt: '2026-07-01T09:17:00+07:00',
  publishedAt: '2026-07-01T09:17:00+07:00',
  publishedEstimated: false,
  collectedAt: '2026-07-01T09:18:30.000Z',
  latencyMs: 90_000,
  dice: [3, 3, 3],
  total: 9,
  flower: null,
  smallLarge: 'tie',
  source: 'bingo18',
};

describe('draw feed maintenance', () => {
  it('formatDrawPeriodLabel hiển thị HH:mm', () => {
    expect(formatDrawPeriodLabel('2026-07-01T09:17:00+07:00')).toBe('09:17');
  });

  it('isDrawFeedStale khi không có draw', () => {
    expect(isDrawFeedStale(null, Date.now())).toBe(true);
  });

  it('isDrawFeedStale khi draw cũ hơn ngưỡng', () => {
    const now = new Date('2026-07-01T12:00:00.000Z').getTime();
    expect(isDrawFeedStale(sampleDraw, now, SOURCE_MAINTENANCE_STALE_MS)).toBe(true);
  });

  it('isDrawFeedStale false khi draw mới', () => {
    const now = new Date('2026-07-01T09:19:00.000Z').getTime();
    expect(isDrawFeedStale(sampleDraw, now, SOURCE_MAINTENANCE_STALE_MS)).toBe(false);
  });
});

describe('source maintenance notification', () => {
  it('thông báo bảo trì kèm kỳ cuối', () => {
    const item = notificationFromSourceMaintenance(true, '09:17', DEFAULT_NOTIFICATION_PREFERENCES);
    expect(item?.kind).toBe('source-maintenance');
    expect(item?.title).toBe('Web nguồn đang bảo trì');
    expect(item?.body).toContain('09:17');
  });

  it('thông báo khi nguồn hoạt động lại', () => {
    const item = notificationFromSourceMaintenance(false, '10:02', DEFAULT_NOTIFICATION_PREFERENCES);
    expect(item?.kind).toBe('source-maintenance-ended');
    expect(item?.body).toContain('10:02');
  });

  it('buildSourceMaintenanceCaption kèm kỳ cuối', () => {
    expect(buildSourceMaintenanceCaption('21:53 · 30/06')).toContain('21:53');
    expect(buildSourceMaintenanceCaption('21:53 · 30/06')).toContain('bảo trì');
  });
});
