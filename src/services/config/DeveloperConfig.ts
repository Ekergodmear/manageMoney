import type { Environment } from '@/services/config/Environment';
import { isDevelopment } from '@/services/config/Environment';

export interface DeveloperConfig {
  readonly showDesignPlayground: boolean;
  readonly enableDevTools: boolean;
  readonly showTelemetry: boolean;
}

export function defaultDeveloperConfig(environment: Environment): DeveloperConfig {
  const dev = isDevelopment(environment);
  return {
    showDesignPlayground: dev,
    enableDevTools: dev,
    showTelemetry: dev,
  };
}
