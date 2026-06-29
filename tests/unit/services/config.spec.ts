import { describe, expect, it, vi } from 'vitest';

import { createAppConfig } from '@/services/config/AppConfig';
import { resolveEnvironment } from '@/services/config/Environment';

describe('AppConfig', () => {
  it('defaults cloud.enabled to false', () => {
    const config = createAppConfig({ environment: 'development' });
    expect(config.cloud.enabled).toBe(false);
  });

  it('includes build info', () => {
    const config = createAppConfig({
      environment: 'development',
      build: { buildVersion: '0.8.0', commitHash: 'abc123', buildDate: '2026-06-01' },
    });
    expect(config.build).toEqual({
      buildVersion: '0.8.0',
      commitHash: 'abc123',
      buildDate: '2026-06-01',
    });
  });

  it('developer tools enabled in development only', () => {
    const dev = createAppConfig({ environment: 'development' });
    const prod = createAppConfig({ environment: 'production' });
    expect(dev.developer.showDesignPlayground).toBe(true);
    expect(prod.developer.showDesignPlayground).toBe(false);
  });

  it('telemetry config has retention and flush interval', () => {
    const config = createAppConfig({ environment: 'development' });
    expect(config.telemetry.enabled).toBe(true);
    expect(config.telemetry.retentionDays).toBeGreaterThan(0);
    expect(config.telemetry.flushIntervalMs).toBeGreaterThan(0);
  });
});

describe('Environment', () => {
  it('resolveEnvironment reads vite mode only from Environment module', () => {
    vi.stubEnv('MODE', 'development');
    vi.stubEnv('PROD', false);
    expect(resolveEnvironment()).toBe('development');
    vi.unstubAllEnvs();
  });
});
