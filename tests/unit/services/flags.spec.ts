import { describe, expect, it } from 'vitest';

import { createAppConfig } from '@/services/config/AppConfig';
import { createFlags, FeatureFlags } from '@/services/feature-flags/Flags';
import { createAppServices } from '@/services/registry/app-services';
import { MemoryStorageDriver } from '@/services/storage/MemoryStorageDriver';

describe('FeatureFlags', () => {
  it('cloud disabled by default', () => {
    const flags = createFlags(createAppConfig({ environment: 'development' }));
    expect(flags.isEnabled('cloud')).toBe(false);
  });

  it('telemetry enabled by default', () => {
    const flags = createFlags(createAppConfig({ environment: 'development' }));
    expect(flags.isEnabled('telemetry')).toBe(true);
  });

  it('playwright enabled in test environment', () => {
    const flags = createFlags(createAppConfig({ environment: 'test' }));
    expect(flags.isEnabled('playwright')).toBe(true);
  });

  it('playwright disabled in production', () => {
    const flags = createFlags(createAppConfig({ environment: 'production' }));
    expect(flags.isEnabled('playwright')).toBe(false);
  });

  it('enable/disable override config', () => {
    const flags = new FeatureFlags(createAppConfig({ environment: 'development' }));
    flags.disable('telemetry');
    expect(flags.isEnabled('telemetry')).toBe(false);
    flags.enable('cloud');
    expect(flags.isEnabled('cloud')).toBe(true);
  });
});

describe('M3.1 DoD — services.flags.isEnabled', () => {
  it('available on AppServices without workspace changes', () => {
    const services = createAppServices({
      storageDriver: new MemoryStorageDriver(),
      config: { environment: 'development' },
    });
    expect(services.flags.isEnabled('cloud')).toBe(false);
    expect(services.flags.isEnabled('telemetry')).toBe(true);
    services.telemetry.dispose();
    services.logger.dispose();
    services.health.dispose();
  });

  it('telemetry store respects flags.isEnabled(telemetry)', async () => {
    const services = createAppServices({
      storageDriver: new MemoryStorageDriver(),
      config: { environment: 'development', telemetry: { enabled: false } },
    });
    services.events.emit(
      services.events.createEvent('PlanGenerated', { sessionId: 's', planId: 'p' }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    const log = await services.telemetry.readAll();
    expect(log).toHaveLength(0);
    services.telemetry.dispose();
    services.logger.dispose();
    services.health.dispose();
  });
});
