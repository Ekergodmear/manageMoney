import type { BuildInfo } from '@/services/config/BuildInfo';
import { resolveBuildInfo } from '@/services/config/BuildInfo';
import type { CloudConfig } from '@/services/config/CloudConfig';
import { DEFAULT_CLOUD_CONFIG } from '@/services/config/CloudConfig';
import type { DeveloperConfig } from '@/services/config/DeveloperConfig';
import { defaultDeveloperConfig } from '@/services/config/DeveloperConfig';
import type { Environment } from '@/services/config/Environment';
import { resolveEnvironment } from '@/services/config/Environment';
import type { TelemetryConfig } from '@/services/config/TelemetryConfig';
import { DEFAULT_TELEMETRY_CONFIG } from '@/services/config/TelemetryConfig';
import type { UiConfig } from '@/services/config/UiConfig';
import { DEFAULT_UI_CONFIG } from '@/services/config/UiConfig';

export interface AppConfig {
  readonly environment: Environment;
  readonly build: BuildInfo;
  readonly telemetry: TelemetryConfig;
  readonly cloud: CloudConfig;
  readonly ui: UiConfig;
  readonly developer: DeveloperConfig;
}

export interface CreateAppConfigOptions {
  readonly environment?: Environment;
  readonly build?: Partial<BuildInfo>;
  readonly telemetry?: Partial<TelemetryConfig>;
  readonly cloud?: Partial<CloudConfig>;
  readonly ui?: Partial<UiConfig>;
  readonly developer?: Partial<DeveloperConfig>;
}

export function createAppConfig(options: CreateAppConfigOptions = {}): AppConfig {
  const environment = options.environment ?? resolveEnvironment();
  return {
    environment,
    build: { ...resolveBuildInfo(), ...options.build },
    telemetry: { ...DEFAULT_TELEMETRY_CONFIG, ...options.telemetry },
    cloud: { ...DEFAULT_CLOUD_CONFIG, ...options.cloud },
    ui: { ...DEFAULT_UI_CONFIG, ...options.ui },
    developer: { ...defaultDeveloperConfig(environment), ...options.developer },
  };
}
