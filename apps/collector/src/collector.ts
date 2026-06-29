import { Bingo18DrawSourceAdapter } from './adapter/bingo18-adapter.js';
import type { DrawSourceAdapter } from './adapter/draw-source-adapter.js';
import { MockDrawSourceAdapter } from './adapter/mock-adapter.js';
import { collectorError, collectorLog } from './log/collector-log.js';
import { parseDrawPayload } from './parser/parse-draw.js';
import type { DrawSink } from './sink/draw-sink.js';
import { AdaptivePollStrategy } from './strategy/adaptive-poll-strategy.js';
import type { PollStrategy } from './strategy/poll-strategy.js';
import {
  initialCollectorState,
  type CollectorState,
} from './types/collector-state.js';

export interface CollectorOptions {
  readonly sink: DrawSink;
  readonly adapter: DrawSourceAdapter;
  readonly pollStrategy?: PollStrategy;
}

export function createAdapterFromEnv(): DrawSourceAdapter {
  const kind = process.env['COLLECTOR_ADAPTER'] ?? 'mock';
  if (kind === 'bingo18') return new Bingo18DrawSourceAdapter();
  return new MockDrawSourceAdapter();
}

export class Collector {
  private state: CollectorState = initialCollectorState();
  private readonly pollStrategy: PollStrategy;
  private running = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly options: CollectorOptions) {
    this.pollStrategy = options.pollStrategy ?? new AdaptivePollStrategy();
  }

  getState(): CollectorState {
    return this.state;
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.state = await this.options.sink.loadCollectorState();
    this.state = { ...this.state, status: 'running' };
    await this.persistState();
    collectorLog(`Started (adapter=${this.options.adapter.id})`);
    if (this.state.lastDraw !== null) {
      collectorLog(`Resumed after draw #${this.state.lastDraw.drawNumber}`);
    }
    void this.scheduleNext(0);
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.state = { ...this.state, status: 'stopped' };
    await this.persistState();
    await this.options.sink.close();
    collectorLog('Stopped');
  }

  private async persistState(): Promise<void> {
    await this.options.sink.saveCollectorState(this.state);
  }

  private scheduleNext(delayMs: number): void {
    if (!this.running) return;
    this.timer = setTimeout(() => {
      void this.tick();
    }, delayMs);
  }

  private async tick(): Promise<void> {
    if (!this.running) return;

    const now = new Date().toISOString();
    this.state = { ...this.state, lastPollAt: now };
    await this.persistState();
    collectorLog('Polling...');

    try {
      const fetch = await this.options.adapter.fetchLatest();
      if (fetch === null) {
        const delay = this.pollStrategy.nextDelayMs(this.state);
        this.scheduleNext(delay);
        return;
      }

      const parsed = parseDrawPayload(fetch.rawPayload, this.options.adapter.id);
      if (!parsed.success || parsed.draw === undefined) {
        collectorError(`Parse failed: ${parsed.errors.join('; ')}`);
        this.state = {
          ...this.state,
          failureCount: this.state.failureCount + 1,
          status: 'degraded',
        };
        await this.persistState();
        const delay = this.pollStrategy.nextDelayMs(this.state);
        this.scheduleNext(delay);
        return;
      }

      const draw = parsed.draw;
      const lastNumber = await this.options.sink.getLastDrawNumber();
      if (lastNumber === draw.drawNumber) {
        const delay = this.pollStrategy.nextDelayMs(this.state);
        this.scheduleNext(delay);
        return;
      }

      await this.options.sink.append(draw);

      const avg =
        this.state.lastDraw === null
          ? draw.latencyMs
          : Math.round((this.state.averageLatencyMs + draw.latencyMs) / 2);

      this.state = {
        ...this.state,
        lastDraw: draw,
        lastSuccessAt: now,
        failureCount: 0,
        averageLatencyMs: avg,
        status: 'running',
      };
      await this.persistState();

      collectorLog(
        `New draw #${draw.drawNumber} — Saved — Latency ${Math.round(draw.latencyMs / 1000)}s`,
      );
    } catch (err) {
      collectorError('Poll error', err);
      this.state = {
        ...this.state,
        failureCount: this.state.failureCount + 1,
        status: 'degraded',
      };
      await this.persistState();
    }

    const delay = this.pollStrategy.nextDelayMs(this.state);
    this.scheduleNext(delay);
  }
}
