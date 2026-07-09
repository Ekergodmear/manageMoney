import { describe, expect, it } from 'vitest';

import { FakeClock } from '@/services/clock/fake-clock';
import { SystemClock } from '@/services/clock/system-clock';

describe('Clock', () => {
  it('SystemClock.now returns current time', () => {
    const before = Date.now();
    const now = SystemClock.now().getTime();
    const after = Date.now();
    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(after);
  });

  it('SystemClock.timestamp matches now', () => {
    const before = Date.now();
    const ts = SystemClock.timestamp();
    expect(ts).toBeGreaterThanOrEqual(before);
  });

  it('FakeClock fixes time for replay', () => {
    const fixed = new Date('2026-06-15T10:30:00.000Z');
    const clock = new FakeClock(fixed);
    expect(clock.now().toISOString()).toBe(fixed.toISOString());
    expect(clock.timestamp()).toBe(fixed.getTime());
    expect(clock.today().getHours()).toBe(0);
  });

  it('FakeClock can advance for simulation', () => {
    const clock = new FakeClock(new Date('2026-01-01'));
    clock.setFixed(new Date('2026-02-01'));
    expect(clock.now().getMonth()).toBe(1);
  });

  it('format uses locale', () => {
    const clock = new FakeClock(new Date('2026-06-15T12:00:00'));
    expect(clock.format(clock.now(), 'en-US')).toContain('2026');
  });
});
