import { describe, expect, it } from 'vitest';

import {
  notificationFromCollectorStatus,
  notificationsFromSettlementAlerts,
} from '@/features/notifications/notification-center';
import {
  addNotification,
  clearAllNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  pruneNotifications,
  unreadCount,
} from '@/features/notifications/notification-store';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  EMPTY_NOTIFICATION_STATE,
  NOTIFICATION_RETENTION_MS,
} from '@/features/notifications/notification-types';

describe('notification-store', () => {
  it('prunes notifications older than 7 days', () => {
    const old = {
      id: 'old',
      kind: 'win' as const,
      title: 'Old',
      body: 'x',
      emoji: '🎉',
      createdAt: new Date(Date.now() - NOTIFICATION_RETENTION_MS - 1000).toISOString(),
      read: false,
    };
    const recent = {
      ...old,
      id: 'new',
      createdAt: new Date().toISOString(),
    };
    const pruned = pruneNotifications([old, recent]);
    expect(pruned).toHaveLength(1);
    expect(pruned[0]?.id).toBe('new');
  });

  it('tracks unread count and mark read', () => {
    let state = addNotification(EMPTY_NOTIFICATION_STATE, {
      id: '1',
      kind: 'win',
      title: 'Win',
      body: '+1M',
      emoji: '🎉',
      createdAt: new Date().toISOString(),
      read: false,
    });
    expect(unreadCount(state.notifications)).toBe(1);
    state = markNotificationRead(state, '1');
    expect(unreadCount(state.notifications)).toBe(0);
    state = markAllNotificationsRead(state);
    state = clearAllNotifications(state);
    expect(state.notifications).toHaveLength(0);
  });
});

describe('notification-center', () => {
  it('creates win notification from settlement alert', () => {
    const items = notificationsFromSettlementAlerts(
      [{ kind: 'win', message: 'Trúng', netPrize: 4_800_000 }],
      { sessionId: 's1', planLabel: 'Plan A' },
      DEFAULT_NOTIFICATION_PREFERENCES,
    );
    expect(items).toHaveLength(1);
    expect(items[0]?.kind).toBe('win');
    expect(items[0]?.amount).toBe(4_800_000);
  });

  it('respects preferences for collector', () => {
    const item = notificationFromCollectorStatus(false, {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      collector: false,
    });
    expect(item).toBeNull();
  });

  it('creates rounds-remaining notifications', () => {
    const items = notificationsFromSettlementAlerts(
      [{ kind: 'rounds-remaining', message: 'Còn 3 kỳ.', roundsRemaining: 3 }],
      { sessionId: 's1', planLabel: 'Plan A' },
      DEFAULT_NOTIFICATION_PREFERENCES,
    );
    expect(items[0]?.kind).toBe('rounds-remaining');
  });
});
