import type { SettlementAlert } from '@/features/game-data/alerts/settlement-alerts';
import type { RecommendationGeneratedEvent } from '@/services/events/event-types';
import {
  type AppNotification,
  type NotificationKind,
  type NotificationPreferences,
} from '@/features/notifications/notification-types';
import { formatAmount } from '@/lib/money-format';

function createNotification(input: {
  kind: NotificationKind;
  title: string;
  body: string;
  emoji: string;
  sessionId?: string;
  amount?: number;
  createdAt?: string;
}): AppNotification {
  return {
    id: crypto.randomUUID(),
    kind: input.kind,
    title: input.title,
    body: input.body,
    emoji: input.emoji,
    createdAt: input.createdAt ?? new Date().toISOString(),
    read: false,
    ...(input.sessionId !== undefined ? { sessionId: input.sessionId } : {}),
    ...(input.amount !== undefined ? { amount: input.amount } : {}),
  };
}

function isEnabled(kind: NotificationKind, prefs: NotificationPreferences): boolean {
  switch (kind) {
    case 'win':
    case 'plan-finished':
      return prefs.win;
    case 'rounds-remaining':
      return prefs.remaining;
    case 'collector-offline':
    case 'collector-online':
      return prefs.collector;
    case 'recommendation-new':
      return prefs.recommendation;
    default:
      return true;
  }
}

export function notificationsFromSettlementAlerts(
  alerts: readonly SettlementAlert[],
  ctx: { readonly sessionId: string; readonly planLabel: string },
  prefs: NotificationPreferences,
): AppNotification[] {
  const result: AppNotification[] = [];

  for (const alert of alerts) {
    if (alert.kind === 'win') {
      if (!isEnabled('win', prefs)) {
        continue;
      }
      result.push(
        createNotification({
          kind: 'win',
          emoji: '🎉',
          title: 'Trúng thưởng',
          body: alert.netPrize !== undefined ? `+${formatAmount(alert.netPrize)} đ` : alert.message,
          sessionId: ctx.sessionId,
          ...(alert.netPrize !== undefined ? { amount: alert.netPrize } : {}),
        }),
      );
      continue;
    }

    if (alert.kind === 'rounds-remaining') {
      if (!isEnabled('rounds-remaining', prefs)) {
        continue;
      }
      result.push(
        createNotification({
          kind: 'rounds-remaining',
          emoji: '⚠',
          title: 'Sắp hết kỳ',
          body: alert.message,
          sessionId: ctx.sessionId,
        }),
      );
      continue;
    }

    if (!isEnabled('plan-finished', prefs)) {
      continue;
    }
    result.push(
      createNotification({
        kind: 'plan-finished',
        emoji: '📋',
        title: `${ctx.planLabel} đã hoàn thành`,
        body: 'Hết kế hoạch — chưa trúng.',
        sessionId: ctx.sessionId,
      }),
    );
  }

  return result;
}

export function notificationFromCollectorStatus(
  online: boolean,
  prefs: NotificationPreferences,
): AppNotification | null {
  const kind = online ? 'collector-online' : 'collector-offline';
  if (!isEnabled(kind, prefs)) {
    return null;
  }
  return createNotification({
    kind,
    emoji: online ? '✅' : '⚠',
    title: online ? 'Collector đã hoạt động' : 'Collector mất kết nối',
    body: online ? 'Đã kết nối lại nguồn draw.' : 'Không lấy được draw mới — kiểm tra Collector.',
  });
}

export function notificationFromRecommendationGenerated(
  event: RecommendationGeneratedEvent,
  prefs: NotificationPreferences,
): AppNotification | null {
  if (!isEnabled('recommendation-new', prefs)) {
    return null;
  }
  const sourceLabel = event.source === 'capital' ? 'Capital Planner' : 'Scenario Planner';
  return createNotification({
    kind: 'recommendation-new',
    emoji: '✨',
    title: `${sourceLabel} có khuyến nghị mới`,
    body: `${String(event.recommendationCount)} phương án — mở để xem.`,
  });
}

export function shouldPresentToast(notification: AppNotification): boolean {
  return (
    notification.kind === 'win' ||
    notification.kind === 'rounds-remaining' ||
    notification.kind === 'plan-finished' ||
    notification.kind === 'collector-offline'
  );
}

export function shouldPlaySound(notification: AppNotification): boolean {
  return (
    notification.kind === 'win' ||
    notification.kind === 'plan-finished' ||
    notification.kind === 'collector-offline'
  );
}

export function shouldShowDesktop(notification: AppNotification): boolean {
  return (
    notification.kind === 'win' ||
    notification.kind === 'collector-offline' ||
    notification.kind === 'collector-online'
  );
}
