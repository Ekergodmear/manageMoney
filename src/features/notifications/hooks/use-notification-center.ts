import { useCallback, useEffect, useRef } from 'react';

import {
  notificationService,
  type NotificationPresentHandlers,
} from '@/features/notifications/notification-service';
import type { NotificationState } from '@/features/notifications/notification-types';
import type { SettlementAlert } from '@/features/game-data/alerts/settlement-alerts';
import { fetchLatestDraw } from '@/features/game-data/adapters/draw-feed-adapter';
import { useServices } from '@/services/registry/AppServicesProvider';

const COLLECTOR_POLL_MS = 30_000;

export interface UseNotificationCenterOptions {
  readonly state: NotificationState;
  readonly onStateChange: (next: NotificationState) => void;
  readonly onToast?: (message: string) => void;
}

export function useNotificationCenter({
  state,
  onStateChange,
  onToast,
}: UseNotificationCenterOptions) {
  const { events } = useServices();
  const stateRef = useRef(state);
  stateRef.current = state;
  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;
  const onToastRef = useRef(onToast);
  onToastRef.current = onToast;

  const handlers = useCallback((): NotificationPresentHandlers => {
    const toast = onToastRef.current;
    return toast !== undefined ? { onToast: toast } : {};
  }, []);

  const ingestSettlementAlerts = useCallback(
    (
      alerts: readonly SettlementAlert[],
      ctx: { readonly sessionId: string; readonly planLabel: string },
    ) => {
      const next = notificationService.ingestSettlementAlerts(
        stateRef.current,
        alerts,
        ctx,
        handlers(),
      );
      onStateChangeRef.current(next);
    },
    [handlers],
  );

  const markRead = useCallback((id: string) => {
    onStateChangeRef.current(notificationService.markRead(stateRef.current, id));
  }, []);

  const markAllRead = useCallback(() => {
    onStateChangeRef.current(notificationService.markAllRead(stateRef.current));
  }, []);

  const clearAll = useCallback(() => {
    onStateChangeRef.current(notificationService.clearAll(stateRef.current));
  }, []);

  const updatePreferences = useCallback((prefs: Partial<NotificationState['preferences']>) => {
    onStateChangeRef.current(notificationService.updatePreferences(stateRef.current, prefs));
  }, []);

  useEffect(() => {
    const unsub = events.subscribe('RecommendationGenerated', (event) => {
      const next = notificationService.ingestRecommendation(stateRef.current, event, handlers());
      if (next !== null) {
        onStateChangeRef.current(next);
      }
    });
    return unsub;
  }, [events, handlers]);

  useEffect(() => {
    const cancelledRef = { current: false };
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastOnline: boolean | null = null;
    let consecutiveFailures = 0;

    async function poll(): Promise<void> {
      const draw = await fetchLatestDraw();
      if (cancelledRef.current) {
        return;
      }

      if (draw === null) {
        consecutiveFailures += 1;
        if (consecutiveFailures >= 2 && lastOnline !== false) {
          lastOnline = false;
          const next = notificationService.ingestCollectorStatus(
            stateRef.current,
            false,
            handlers(),
          );
          if (next !== null) {
            onStateChangeRef.current(next);
          }
        }
      } else {
        consecutiveFailures = 0;
        if (lastOnline === false) {
          lastOnline = true;
          const next = notificationService.ingestCollectorStatus(
            stateRef.current,
            true,
            handlers(),
          );
          if (next !== null) {
            onStateChangeRef.current(next);
          }
        } else if (lastOnline === null) {
          lastOnline = true;
        }
      }

      timer = setTimeout(() => {
        if (cancelledRef.current) {
          return;
        }
        void poll();
      }, COLLECTOR_POLL_MS);
    }

    void poll();

    return () => {
      cancelledRef.current = true;
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    };
  }, [handlers]);

  return {
    unreadCount: notificationService.unread(state),
    ingestSettlementAlerts,
    markRead,
    markAllRead,
    clearAll,
    updatePreferences,
  };
}
