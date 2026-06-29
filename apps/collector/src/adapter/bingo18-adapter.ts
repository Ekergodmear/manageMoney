import { collectorLog } from '../log/collector-log.js';
import type { DrawSourceAdapter } from './draw-source-adapter.js';

/**
 * Production Bingo18 source — stub until API / Playwright spike.
 * Returns null; does not throw.
 */
export class Bingo18DrawSourceAdapter implements DrawSourceAdapter {
  readonly id = 'bingo18';

  async fetchLatest(): Promise<{ rawPayload: unknown } | null> {
    collectorLog('Bingo18 adapter not configured — set source URL in env (spike pending)');
    return null;
  }
}
