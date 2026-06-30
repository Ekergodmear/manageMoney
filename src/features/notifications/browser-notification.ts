import type { AppNotification } from '@/features/notifications/notification-types';
import { shouldShowDesktop } from '@/features/notifications/notification-center';

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  return Notification.requestPermission();
}

export function showBrowserNotification(notification: AppNotification): void {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }
  if (Notification.permission !== 'granted' || !shouldShowDesktop(notification)) {
    return;
  }
  try {
    new Notification(`${notification.emoji} Stake Planner`, {
      body: `${notification.title} — ${notification.body}`,
      tag: notification.id,
      silent: true,
    });
  } catch {
    // ignore — some browsers block without user gesture
  }
}
