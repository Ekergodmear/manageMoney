import { useEffect, useRef, useState } from 'react';

import { alertsFromSettlement } from '@/features/game-data/alerts/settlement-alerts';
import { fetchLatestDraw } from '@/features/game-data/adapters/draw-feed-adapter';
import { applySettlementToSession } from '@/features/game-data/settlement/apply-settlement-use-case';
import type { SettlementAlert } from '@/features/game-data/alerts/settlement-alerts';
import type { CollectorDrawResult } from '@/features/game-monitor/collector-api-types';
import type { GamePolicyPreset } from '@/features/game-designer/game-policy-types';
import { getCurrentPlan, type Session } from '@/features/session/session-domain';

const POLL_MS = 12_000;

export interface AutoSettlementCallbacks {
  readonly onSessionUpdate: (session: Session) => void;
  readonly onAlerts: (alerts: readonly SettlementAlert[]) => void;
  readonly onWin: (session: Session) => void;
}

/**
 * Poll Collector và auto-settle session đang playing (activeSessionId).
 */
export function useAutoSettlement(
  activeSession: Session | null,
  preset: GamePolicyPreset | undefined,
  callbacks: AutoSettlementCallbacks,
): CollectorDrawResult | null {
  const [latestDraw, setLatestDraw] = useState<CollectorDrawResult | null>(null);
  const sessionRef = useRef(activeSession);
  sessionRef.current = activeSession;
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const presetRef = useRef(preset);
  presetRef.current = preset;

  useEffect(() => {
    sessionRef.current = activeSession;
  }, [activeSession]);

  useEffect(() => {
    const cancelledRef = { current: false };
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function poll(): Promise<void> {
      const draw = await fetchLatestDraw();
      if (cancelledRef.current) {
        return;
      }
      setLatestDraw(draw);

      const session = sessionRef.current;
      if (session !== null && session.status === 'playing' && draw !== null) {
        if (session.lastSettledDrawKey === null) {
          const primed: Session = {
            ...session,
            lastSettledDrawKey: draw.drawKey,
            updatedAt: new Date().toISOString(),
          };
          sessionRef.current = primed;
          callbacksRef.current.onSessionUpdate(primed);
        } else {
          const plan = getCurrentPlan(session);
          const previousCompleted = plan?.completedThroughRound ?? 0;
          const outcome = applySettlementToSession(session, draw, presetRef.current);
          if (outcome !== null) {
            sessionRef.current = outcome.session;
            callbacksRef.current.onSessionUpdate(outcome.session);
            const planAfter = getCurrentPlan(outcome.session);
            const totalRounds = planAfter?.generated.strategy.rounds.length ?? 0;
            const completed = planAfter?.completedThroughRound ?? 0;
            const alerts = alertsFromSettlement(
              outcome.won,
              outcome.settlement.netPrize,
              completed,
              totalRounds,
              previousCompleted,
            );
            if (alerts.length > 0) {
              callbacksRef.current.onAlerts(alerts);
            }
            if (outcome.won) {
              callbacksRef.current.onWin(outcome.session);
            }
          }
        }
      }

      timer = setTimeout(() => {
        if (cancelledRef.current) {
          return;
        }
        void poll();
      }, POLL_MS);
    }

    void poll();

    return () => {
      cancelledRef.current = true;
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    };
  }, [activeSession?.id, activeSession?.status]);

  return latestDraw;
}
