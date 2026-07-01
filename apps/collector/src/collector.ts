import { Bingo18DrawSourceAdapter } from './adapter/bingo18-adapter.js';
import type { DrawSourceAdapter } from './adapter/draw-source-adapter.js';
import { MockDrawSourceAdapter } from './adapter/mock-adapter.js';
import { collectorError, collectorLog } from './log/collector-log.js';
import { prepareDrawsForIngest } from './dedupe/ingest-dedupe.js';
import {
  deriveResumeStateOnStart,
  finalizeResumeSession,
  resolveCatchUpDraws,
} from './resume/index.js';
import type { DrawSink } from './sink/draw-sink.js';
import { AdaptivePollStrategy } from './strategy/adaptive-poll-strategy.js';
import type { PollStrategy } from './strategy/poll-strategy.js';
import { initialCollectorState, type CollectorState } from './types/collector-state.js';
import type { DrawResult } from './types/draw-result.js';
import { syncFullDrawHistory, type SyncHistoryResult } from './sync/sync-full-history.js';

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
  private resumeSessionActive = false;

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
    const loaded = await this.options.sink.loadCollectorState();
    const resume = deriveResumeStateOnStart(loaded);
    this.resumeSessionActive = loaded.lastDrawKey !== null;
    this.state = {
      ...loaded,
      ...resume,
      status: 'running',
    };
    await this.persistState();
    collectorLog(`Started (adapter=${this.options.adapter.id})`);
    this.scheduleNext(0);
  }

  /** One-shot merge of full bingo18 history into SQLite. */
  async syncFullHistory(): Promise<SyncHistoryResult> {
    return syncFullDrawHistory(this.options.sink, this.options.adapter);
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

  private completeResumeSession(insertedCount: number): void {
    if (!this.resumeSessionActive) return;
    const resumeUpdate = finalizeResumeSession(this.state, insertedCount);
    this.state = { ...this.state, ...resumeUpdate };
    this.resumeSessionActive = false;
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
        collectorError(`Adapter returned null — backoff ${String(delay)}ms`);
        this.scheduleNext(delay);
        return;
      }

      this.consecutiveAdapterFailures = 0;

      const { draws: candidates, errors, skippedDuplicates: resolveSkipped } =
        await resolveCatchUpDraws(
          this.options.sink,
          this.state,
          fetch.rawPayload,
          this.options.adapter.id,
          fetch.rawResponse,
        );

      if (errors.length > 0) {
        collectorError(`Parse warnings: ${errors.join('; ')}`);
      }

      if (candidates.length === 0) {
        if (resolveSkipped > 0) {
          this.state = {
            ...this.state,
            duplicatesSkipped: this.state.duplicatesSkipped + resolveSkipped,
          };
        }
        this.completeResumeSession(0);
        await this.persistState();
        const delay = this.pollStrategy.nextDelayMs(this.state);
        this.scheduleNext(delay);
        return;
      }

      const known = new Set<string>();
      if (candidates.length <= 200) {
        for (const draw of candidates) {
          const existing = await this.options.sink.findByDrawKey(draw.drawKey);
          if (existing !== null) known.add(draw.drawKey);
        }
      }

      const { draws: toInsert, skippedDuplicates: preSkipped } = prepareDrawsForIngest(
        candidates,
        known,
      );
      const preFilterSkipped = resolveSkipped + preSkipped;

      if (toInsert.length === 0) {
        if (preFilterSkipped > 0) {
          this.state = {
            ...this.state,
            duplicatesSkipped: this.state.duplicatesSkipped + preFilterSkipped,
          };
        }
        this.completeResumeSession(0);
        await this.persistState();
        const delay = this.pollStrategy.nextDelayMs(this.state);
        this.scheduleNext(delay);
        return;
      }

      const appendResult = await this.options.sink.appendMany(toInsert);
      const skipped = preFilterSkipped + appendResult.skipped;

      if (appendResult.inserted === 0) {
        if (skipped > 0) {
          this.state = {
            ...this.state,
            duplicatesSkipped: this.state.duplicatesSkipped + skipped,
          };
        }
        this.completeResumeSession(0);
        await this.persistState();
        const delay = this.pollStrategy.nextDelayMs(this.state);
        this.scheduleNext(delay);
        return;
      }

      const latest = (await this.options.sink.findLatest()) ?? toInsert[toInsert.length - 1];
      const avg = computeAverageLatency(this.state.averageLatencyMs, toInsert);

      this.state = {
        ...this.state,
        lastDrawKey: latest.drawKey,
        lastDraw: latest,
        lastSuccessAt: now,
        failureCount: 0,
        averageLatencyMs: avg,
        duplicatesSkipped: this.state.duplicatesSkipped + skipped,
        status: 'running',
      };
      this.completeResumeSession(appendResult.inserted);
      await this.persistState();

      if (appendResult.inserted > 1) {
        collectorLog(
          `Saved ${String(appendResult.inserted)} draws (${toInsert[0].drawKey} … ${latest.drawKey})`,
        );
      } else {
        collectorLog(
          `New draw ${latest.drawKey} — Saved — Latency ${String(Math.round(latest.latencyMs / 1000))}s`,
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
