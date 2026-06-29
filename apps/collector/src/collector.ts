import { Bingo18DrawSourceAdapter } from './adapter/bingo18-adapter.js';
import type { DrawSourceAdapter } from './adapter/draw-source-adapter.js';
import { MockDrawSourceAdapter } from './adapter/mock-adapter.js';
import { collectorError, collectorLog } from './log/collector-log.js';
import {
  isBingo18BatchPayload,
  parseBingo18DrawBatch,
  parseDrawPayload,
} from './parser/parse-draw.js';
import type { DrawSink } from './sink/draw-sink.js';
import { AdaptivePollStrategy } from './strategy/adaptive-poll-strategy.js';
import type { PollStrategy } from './strategy/poll-strategy.js';
import {
  initialCollectorState,
  type CollectorState,
} from './types/collector-state.js';
import type { DrawResult } from './types/draw-result.js';
import { dedupeDrawsByNumber, filterNewDraws } from './util/dedupe.js';

export interface CollectorOptions {
  readonly sink: DrawSink;
  readonly adapter: DrawSourceAdapter;
  readonly pollStrategy?: PollStrategy;
  readonly adapterBackoffMs?: number;
}

export function createAdapterFromEnv(): DrawSourceAdapter {
  const kind = process.env['COLLECTOR_ADAPTER'] ?? 'mock';
  if (kind === 'bingo18') return new Bingo18DrawSourceAdapter();
  return new MockDrawSourceAdapter();
}

function computeAverageLatency(prev: number, draws: readonly DrawResult[]): number {
  if (draws.length === 0) return prev;
  const batchAvg = draws.reduce((sum, d) => sum + d.latencyMs, 0) / draws.length;
  return prev === 0 ? Math.round(batchAvg) : Math.round((prev + batchAvg) / 2);
}

export class Collector {
  private state: CollectorState = initialCollectorState();
  private readonly pollStrategy: PollStrategy;
  private readonly adapterBackoffMs: number;
  private running = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private consecutiveAdapterFailures = 0;

  constructor(private readonly options: CollectorOptions) {
    this.pollStrategy = options.pollStrategy ?? new AdaptivePollStrategy();
    this.adapterBackoffMs = options.adapterBackoffMs ?? 5_000;
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

  private adapterFailureDelay(): number {
    const backoff = this.adapterBackoffMs * 2 ** Math.min(this.consecutiveAdapterFailures, 5);
    return Math.min(backoff, 120_000);
  }

  private async resolveNewDraws(rawPayload: unknown, source: string): Promise<{
    draws: DrawResult[];
    errors: string[];
  }> {
    if (isBingo18BatchPayload(rawPayload)) {
      const batch = parseBingo18DrawBatch(rawPayload, source);
      const unique = dedupeDrawsByNumber(batch.draws);
      const lastNumber = await this.options.sink.getLastDrawNumber();
      if (lastNumber === null) {
        return { draws: unique.slice(-1), errors: batch.errors };
      }
      const lastTime = new Date(
        (await this.options.sink.findByDrawNumber(lastNumber))?.drawTime ??
          this.state.lastDraw?.drawTime ??
          lastNumber,
      ).getTime();
      const newer = unique.filter((d) => new Date(d.drawTime).getTime() > lastTime);
      return { draws: newer, errors: batch.errors };
    }

    const parsed = parseDrawPayload(rawPayload, source);
    if (!parsed.success || parsed.draw === undefined) {
      return { draws: [], errors: parsed.errors };
    }

    const lastNumber = await this.options.sink.getLastDrawNumber();
    if (lastNumber === parsed.draw.drawNumber) {
      return { draws: [], errors: [] };
    }

    const existing = await this.options.sink.findByDrawNumber(parsed.draw.drawNumber);
    if (existing !== null) {
      return { draws: [], errors: [] };
    }

    return { draws: [parsed.draw], errors: [] };
  }

  private async tick(): Promise<void> {
    if (!this.running) return;

    const now = new Date().toISOString();
    this.state = { ...this.state, lastPollAt: now };
    await this.persistState();
    collectorLog('Polling');

    try {
      const fetch = await this.options.adapter.fetchLatest();
      if (fetch === null) {
        this.consecutiveAdapterFailures += 1;
        this.state = {
          ...this.state,
          failureCount: this.state.failureCount + 1,
          status: 'degraded',
        };
        await this.persistState();
        const delay = this.adapterFailureDelay();
        collectorError(`Adapter returned null — backoff ${delay}ms`);
        this.scheduleNext(delay);
        return;
      }

      this.consecutiveAdapterFailures = 0;

      const { draws: candidates, errors } = await this.resolveNewDraws(
        fetch.rawPayload,
        this.options.adapter.id,
      );

      if (errors.length > 0) {
        collectorError(`Parse warnings: ${errors.join('; ')}`);
      }

      if (candidates.length === 0) {
        const delay = this.pollStrategy.nextDelayMs(this.state);
        this.scheduleNext(delay);
        return;
      }

      const known = new Set<string>();
      for (const draw of candidates) {
        const existing = await this.options.sink.findByDrawNumber(draw.drawNumber);
        if (existing !== null) known.add(draw.drawNumber);
      }
      const newDraws = filterNewDraws(candidates, known);

      if (newDraws.length === 0) {
        const delay = this.pollStrategy.nextDelayMs(this.state);
        this.scheduleNext(delay);
        return;
      }

      await this.options.sink.appendMany(newDraws);

      const latest = newDraws[newDraws.length - 1];
      const avg = computeAverageLatency(this.state.averageLatencyMs, newDraws);

      this.state = {
        ...this.state,
        lastDraw: latest,
        lastSuccessAt: now,
        failureCount: 0,
        averageLatencyMs: avg,
        status: 'running',
      };
      await this.persistState();

      for (const draw of newDraws) {
        collectorLog(
          `New draw #${draw.drawNumber} — Saved — Latency ${Math.round(draw.latencyMs / 1000)}s`,
        );
      }
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
