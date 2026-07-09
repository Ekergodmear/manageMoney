import {
  NOTIFICATION_RETENTION_MS,
  type AppNotification,
  type NotificationState,
} from '@/features/notifications/notification-types';

export function pruneNotifications(
  notifications: readonly AppNotification[],
  nowMs: number = Date.now(),
): AppNotification[] {
  const cutoff = nowMs - NOTIFICATION_RETENTION_MS;
  return notifications.filter((n) => new Date(n.createdAt).getTime() >= cutoff);
}

export function unreadCount(notifications: readonly AppNotification[]): number {
  return notifications.filter((n) => !n.read).length;
}

export function addNotification(
  state: NotificationState,
  notification: AppNotification,
  nowMs: number = Date.now(),
): NotificationState {
  const pruned = pruneNotifications(state.notifications, nowMs);
  return {
    ...state,
    notifications: [notification, ...pruned].slice(0, 200),
  };
}

export function markNotificationRead(state: NotificationState, id: string): NotificationState {
  return {
    ...state,
    notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
  };
}

export function markAllNotificationsRead(state: NotificationState): NotificationState {
  return {
    ...state,
    notifications: state.notifications.map((n) => ({ ...n, read: true })),
  };
}

export function clearAllNotifications(state: NotificationState): NotificationState {
  return { ...state, notifications: [] };
}

export function updatePreferences(
  state: NotificationState,
  preferences: Partial<NotificationState['preferences']>,
): NotificationState {
  return {
    ...state,
    preferences: { ...state.preferences, ...preferences },
  };
}
