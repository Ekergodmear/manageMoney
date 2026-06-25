/**
 * Latency measurement — warmup + iterations, returns µs/op.
 * Memory profiling deferred to future sprint (see PERFORMANCE-CONTRACT.md).
 */

export interface MeasureOptions {
  readonly warmup: number;
  readonly iterations: number;
}

export function measureLatency(fn: () => void, options: MeasureOptions): number {
  const { warmup, iterations } = options;

  for (let i = 0; i < warmup; i++) {
    fn();
  }

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();

  const totalMs = end - start;
  return (totalMs / iterations) * 1000;
}
