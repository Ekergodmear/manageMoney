import { describe, expect, it } from 'vitest';

import { FakeClock } from '@/services/clock/fake-clock';
import type { LogEntry, LogSink } from '@/services/logger/sinks/log-sink';
import { createAppServices } from '@/services/registry/app-services';
import { MemoryStorageDriver } from '@/services/storage/MemoryStorageDriver';

class CaptureSink implements LogSink {
  readonly entries: LogEntry[] = [];

  write(entry: LogEntry): void {
    this.entries.push(entry);
  }
}

describe('Milestone 2 DoD — Operational Services', () => {
  it('emit PlanGenerated → TelemetryStore.append → Logger sink → Health unchanged', async () => {
    const sink = new CaptureSink();
    const services = createAppServices({
      clock: new FakeClock(new Date('2026-06-25T12:00:00.000Z')),
      storageDriver: new MemoryStorageDriver(),
      logSinks: [sink],
    });

    const healthBefore = services.health.getSnapshot();

    services.events.emit(
      services.events.createEvent('PlanGenerated', {
        sessionId: 'session-1',
        planId: 'plan-a',
      }),
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    const log = await services.telemetry.readAll();
    expect(log.filter((e) => e.type === 'PlanGenerated')).toHaveLength(1);
    expect(sink.entries.some((e) => e.event.type === 'PlanGenerated')).toBe(true);
    expect(services.health.getSnapshot().status).toBe(healthBefore.status);

    services.telemetry.dispose();
    services.logger.dispose();
    services.health.dispose();
  });
});
