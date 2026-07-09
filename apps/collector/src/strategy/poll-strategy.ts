import type { CollectorState } from '../types/collector-state.js';

export interface PollStrategy {
  nextDelayMs(state: CollectorState): number;
}
