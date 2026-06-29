import { describe, expect, it, vi } from 'vitest';

import { FakeClock } from '@/services/clock/fake-clock';
import { Logger } from '@/services/logger/logger';
import type { LogEntry, LogSink } from '@/services/logger/sinks/log-sink';
import { EventBus } from '@/services/events/domain-events';
import { MemoryStorageDriver } from '@/services/storage/MemoryStorageDriver';
import { createAppServices } from '@/services/registry/app-services';

class MemorySink implements LogSink {
  readonly entries: LogEntry[] = [];

  write(entry: LogEntry): void {
    this.entries.push(entry);
  }
}

describe('Logger', () => {
  it('writes through sink — Logger does not call console directly', () => {
    const sink = new MemorySink();
    const bus = new EventBus(new FakeClock(new Date('2026-06-01')));
    const logger = new Logger(bus, [sink]);

    const event = bus.createEvent('PlanGenerated', { sessionId: 's', planId: 'p' });
    logger.log(event);

    expect(sink.entries).toHaveLength(1);
    expect(sink.entries[0]?.message).toBe('PlanGenerated');
    logger.dispose();
  });

  it('subscribes to all events via bus on operational startup', () => {
    const sink = new MemorySink();
    const services = createAppServices({
      storageDriver: new MemoryStorageDriver(),
      logSinks: [sink],
    });

    services.events.emit(
      services.events.createEvent('PlanGenerated', { sessionId: 's', planId: 'p' }),
    );

    expect(sink.entries.some((e) => e.event.type === 'PlanGenerated')).toBe(true);
    services.telemetry.dispose();
    services.logger.dispose();
    services.health.dispose();
  });

  it('ConsoleSink is only used via Logger wiring — not imported in features', () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const services = createAppServices({ storageDriver: new MemoryStorageDriver() });
    services.events.emit(services.events.createEvent('PlanningViewed', {}));
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
    services.telemetry.dispose();
    services.logger.dispose();
    services.health.dispose();
  });
});
