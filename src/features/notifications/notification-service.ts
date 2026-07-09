import {
  notificationFromCollectorStatus,
  notificationFromRecommendationGenerated,
  notificationFromSourceMaintenance,
  notificationsFromSettlementAlerts,
  shouldPresentToast,
} from '@/features/notifications/notification-center';
import {
  addNotification,
  clearAllNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  pruneNotifications,
  unreadCount,
} from '@/features/notifications/notification-store';
import type {
  AppNotification,
  NotificationPreferences,
  NotificationState,
} from '@/features/notifications/notification-types';
import { playNotificationSound } from '@/features/notifications/notification-sound';
import { showBrowserNotification } from '@/features/notifications/browser-notification';
import type { SettlementAlert } from '@/features/game-data/alerts/settlement-alerts';
import type { RecommendationGeneratedEvent } from '@/services/events/event-types';

export interface NotificationPresentHandlers {
  readonly onToast?: (message: string) => void;
}

export class NotificationService {
  ingestMany(
    state: NotificationState,
    items: readonly AppNotification[],
    handlers: NotificationPresentHandlers = {},
  ): NotificationState {
    let next: NotificationState = {
      ...state,
      notifications: pruneNotifications(state.notifications),
    };
    for (const item of items) {
      next = addNotification(next, item);
      this.present(item, next.preferences, handlers);
    }
    return next;
  }

  ingestSettlementAlerts(
    state: NotificationState,
    alerts: readonly SettlementAlert[],
    ctx: { readonly sessionId: string; readonly planLabel: string },
    handlers: NotificationPresentHandlers = {},
  ): NotificationState {
    const items = notificationsFromSettlementAlerts(alerts, ctx, state.preferences);
    return this.ingestMany(state, items, handlers);
  }

  ingestCollectorStatus(
    state: NotificationState,
    online: boolean,
    handlers: NotificationPresentHandlers = {},
  ): NotificationState | null {
    const item = notificationFromCollectorStatus(online, state.preferences);
    if (item === null) {
      return null;
    }
    return this.ingestMany(state, [item], handlers);
  }

  ingestSourceMaintenance(
    state: NotificationState,
    active: boolean,
    lastDrawPeriod: string | null,
    handlers: NotificationPresentHandlers = {},
  ): NotificationState | null {
    const item = notificationFromSourceMaintenance(active, lastDrawPeriod, state.preferences);
    if (item === null) {
      return null;
    }
    return this.ingestMany(state, [item], handlers);
  }

  ingestRecommendation(
    state: NotificationState,
    event: RecommendationGeneratedEvent,
    handlers: NotificationPresentHandlers = {},
  ): NotificationState | null {
    const item = notificationFromRecommendationGenerated(event, state.preferences);
    if (item === null) {
      return null;
    }
    return this.ingestMany(state, [item], handlers);
  }

  markRead(state: NotificationState, id: string): NotificationState {
    return markNotificationRead(state, id);
  }

  markAllRead(state: NotificationState): NotificationState {
    return markAllNotificationsRead(state);
  }

  clearAll(state: NotificationState): NotificationState {
    return clearAllNotifications(state);
  }

  updatePreferences(
    state: NotificationState,
    prefs: Partial<NotificationPreferences>,
  ): NotificationState {
    return { ...state, preferences: { ...state.preferences, ...prefs } };
  }

  unread(state: NotificationState): number {
    return unreadCount(state.notifications);
  }

  private present(
    notification: AppNotification,
    prefs: NotificationPreferences,
    handlers: NotificationPresentHandlers,
  ): void {
    if (prefs.sound) {
      playNotificationSound(notification);
    }
    if (prefs.desktop) {
      showBrowserNotification(notification);
    }
    if (handlers.onToast !== undefined && shouldPresentToast(notification)) {
      handlers.onToast(`${notification.emoji} ${notification.title} — ${notification.body}`);
    }
  }
}

export const notificationService = new NotificationService();
