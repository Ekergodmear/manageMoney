import type { CollectorState } from '../types/collector-state.js';
import type { PollStrategy } from './poll-strategy.js';

/**
 * Adaptive polling — elapsed since last known draw.
 * 0–4 min: 60s · 4–6 min: 20s · >6 min: 10s
 */
export class AdaptivePollStrategy implements PollStrategy {
  nextDelayMs(state: CollectorState): number {
    const anchor = state.lastDraw?.drawTime ?? state.lastSuccessAt;
    if (anchor === null) {
      return 60_000;
    }
    const elapsedMs = Date.now() - new Date(anchor).getTime();
    const elapsedMin = elapsedMs / 60_000;
    if (elapsedMin < 4) return 60_000;
    if (elapsedMin < 6) return 20_000;
    return 10_000;
  }
}
