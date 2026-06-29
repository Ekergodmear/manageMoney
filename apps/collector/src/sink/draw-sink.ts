import type { CollectorState } from '../types/collector-state.js';
import type { DrawResult } from '../types/draw-result.js';

export interface DrawSink {
  append(draw: DrawResult): Promise<void>;
  appendMany(draws: readonly DrawResult[]): Promise<void>;
  getLastDrawNumber(): Promise<string | null>;
  loadCollectorState(): Promise<CollectorState>;
  saveCollectorState(state: CollectorState): Promise<void>;
  close(): Promise<void>;
}
