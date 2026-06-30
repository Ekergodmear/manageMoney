import type { AppConfig } from '@/services/config/AppConfig';
import { isTest } from '@/services/config/Environment';

export type FeatureFlag = 'cloud' | 'telemetry' | 'playwright';

export interface Flags {
  isEnabled(flag: FeatureFlag): boolean;
  enable(flag: FeatureFlag): void;
  disable(flag: FeatureFlag): void;
}

export class FeatureFlags implements Flags {
  private readonly overrides = new Map<FeatureFlag, boolean>();

  constructor(private readonly config: AppConfig) {}

  isEnabled(flag: FeatureFlag): boolean {
    const override = this.overrides.get(flag);
    if (override !== undefined) {
      return override;
    }
    return defaultForFlag(flag, this.config);
  }

  enable(flag: FeatureFlag): void {
    this.overrides.set(flag, true);
  }

  disable(flag: FeatureFlag): void {
    this.overrides.set(flag, false);
  }
}

function defaultForFlag(flag: FeatureFlag, config: AppConfig): boolean {
  switch (flag) {
    case 'cloud':
      return config.cloud.enabled;
    case 'telemetry':
      return config.telemetry.enabled;
    case 'playwright':
      return isTest(config.environment);
    default: {
      const exhaustive: never = flag;
      return exhaustive;
    }
  }
}

export function createFlags(config: AppConfig): FeatureFlags {
  return new FeatureFlags(config);
}

/** @deprecated Use FeatureFlags — alias for docs */
export type FlagsService = Flags;
